import { getModelReleaseCopy } from "@/services/modelRelease/copy";
import { createModelReleasePdf } from "@/services/modelRelease/pdf";
import {
  createReleaseRequestContext,
  deliverRelease,
  getErrorDetails,
  getReleaseConfigurationStatus,
  logReleaseEvent,
  ReleaseRequestContext,
  ReleaseStageError,
  runReleaseStage,
} from "@/services/releaseDelivery";
import {
  createModelReleaseSchema,
  getMadridDate,
} from "@/app/model-release/types";
import { locales } from "@/i18n/config";
import { NextResponse } from "next/server";
import type { ReleaseStage } from "@/services/releaseDelivery";

const getText = (formData: FormData, key: string): string =>
  formData.get(key)?.toString() ?? "";

const getErrorMessage = (
  issueMessage: string,
  path: string,
  locale: string,
) => {
  const copy = getModelReleaseCopy(locale);
  switch (path) {
    case "fullName":
      return copy.errorFullName;
    case "birthDate":
      return issueMessage === "error_age" ? copy.errorAge : copy.errorBirthDate;
    case "documentNumber":
      return copy.errorDocumentNumber;
    case "email":
      return copy.errorEmail;
    case "phone":
      return copy.errorPhone;
    case "signature":
      return copy.errorSignature;
    default:
      return copy.errorGeneric;
  }
};

const isRetryableStage = (stage?: ReleaseStage) =>
  stage === "archive" ||
  stage === "photographer_email" ||
  stage === "client_email";

const failureResponse = (
  error: unknown,
  locale: string,
  context: ReleaseRequestContext,
) => {
  const copy = getModelReleaseCopy(locale);
  const stage = error instanceof ReleaseStageError ? error.stage : undefined;
  const retryable = isRetryableStage(stage);
  logReleaseEvent({
    ...context,
    event: "release_submission_failed",
    level: "error",
    stage,
    archiveName:
      error instanceof ReleaseStageError ? error.archiveName : undefined,
    error: getErrorDetails(error),
  });
  return NextResponse.json(
    {
      success: false,
      message: `${copy.errorGeneric} ${copy.errorReference}: ${context.requestId}`,
      requestId: context.requestId,
      retryable,
    },
    { status: retryable ? 502 : 500 },
  );
};

export async function POST(request: Request) {
  const context = createReleaseRequestContext("model", request);
  logReleaseEvent({
    ...context,
    event: "release_submission_received",
    level: "info",
    configuration: getReleaseConfigurationStatus(),
  });

  try {
    const formData = await request.formData();
    const requestedLocale = getText(formData, "locale");
    const locale = locales.includes(requestedLocale as (typeof locales)[number])
      ? requestedLocale
      : "en";
    const releaseDate = getMadridDate();
    const values = {
      fullName: getText(formData, "fullName"),
      birthDate: getText(formData, "birthDate"),
      documentNumber: getText(formData, "documentNumber"),
      email: getText(formData, "email"),
      phone: getText(formData, "phone"),
      gender: getText(formData, "gender"),
      address: getText(formData, "address"),
      city: getText(formData, "city"),
      state: getText(formData, "state"),
      country: getText(formData, "country"),
      postalCode: getText(formData, "postalCode"),
      signature: getText(formData, "signature"),
    };
    const result = createModelReleaseSchema(releaseDate).safeParse(values);

    try {
      if (!result.success) {
        const firstIssue = result.error.issues[0];
        const path = firstIssue?.path[0]?.toString() ?? "";
        logReleaseEvent({
          ...context,
          event: "release_validation_failed",
          level: "info",
        });
        return NextResponse.json(
          {
            success: false,
            message: getErrorMessage(firstIssue?.message ?? "", path, locale),
          },
          { status: 400 },
        );
      }

      const copy = getModelReleaseCopy(locale);
      const pdf = await runReleaseStage(context, "pdf_generation", () =>
        createModelReleasePdf({
          values: result.data,
          copy,
          releaseDate,
        }),
      );
      const photographerEmail =
        process.env.RELEASE_RECIPIENT_EMAIL ?? "info@boudoir.barcelona";
      await deliverRelease({
        ...context,
        releaseDate,
        pdf,
        filename: `model-release-${releaseDate}.pdf`,
        photographerEmail,
        clientEmail: result.data.email,
        subject: copy.emailSubject,
        photographerText: (archiveName) =>
          `${copy.title}\n\n${copy.fullName}: ${result.data.fullName}\n${copy.email}: ${result.data.email}\n${copy.releaseDate}: ${releaseDate}\n\nArchive reference: ${archiveName}`,
        clientText: copy.successMessage,
      });

      logReleaseEvent({
        ...context,
        event: "release_submission_completed",
        level: "info",
      });

      return NextResponse.json({
        success: true,
        message: copy.successMessage,
        requestId: context.requestId,
      });
    } catch (error) {
      return failureResponse(error, locale, context);
    }
  } catch (error) {
    return failureResponse(error, "en", context);
  }
}
