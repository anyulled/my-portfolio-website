import { getReleaseCopy } from "@/services/photographyRelease/copy";
import { createPhotographyReleasePdf } from "@/services/photographyRelease/pdf";
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
  getMadridDate,
  releaseFormSchema,
} from "@/app/photography-release/types";
import { locales } from "@/i18n/config";
import { NextResponse } from "next/server";
import type { ReleaseStage } from "@/services/releaseDelivery";

const getText = (formData: FormData, key: string): string =>
  formData.get(key)?.toString() ?? "";

const errorMessageFor = (
  issueMessage: string,
  path: string,
  locale: string,
) => {
  const copy = getReleaseCopy(locale);
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
    case "sessionDate":
      return copy.errorSessionDate;
    case "signature":
      return copy.errorSignature;
    case "privacyLevel":
      return issueMessage === "error_privacy_without_permission"
        ? copy.errorPrivacyWithoutPermission
        : copy.errorPrivacyLevel;
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
  const copy = getReleaseCopy(locale);
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

const createSubmission = (formData: FormData) => {
  const requestedLocale = getText(formData, "locale");
  const locale = locales.includes(requestedLocale as (typeof locales)[number])
    ? requestedLocale
    : "en";
  const sessionDate = getMadridDate();
  const values = {
    fullName: getText(formData, "fullName"),
    birthDate: getText(formData, "birthDate"),
    documentNumber: getText(formData, "documentNumber"),
    email: getText(formData, "email"),
    phone: getText(formData, "phone"),
    sessionDate,
    usagePermissions: formData
      .getAll("usagePermissions")
      .map((value) => value.toString()),
    privacyLevel: getText(formData, "privacyLevel") || undefined,
    signature: getText(formData, "signature"),
  };

  return { locale, sessionDate, result: releaseFormSchema.safeParse(values) };
};

export async function POST(request: Request) {
  const context = createReleaseRequestContext("photography", request);
  logReleaseEvent({
    ...context,
    event: "release_submission_received",
    level: "info",
    configuration: getReleaseConfigurationStatus(),
  });

  try {
    const formData = await request.formData();
    const submission = createSubmission(formData);
    const { locale, sessionDate, result } = submission;

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
            message: errorMessageFor(firstIssue?.message ?? "", path, locale),
          },
          { status: 400 },
        );
      }

      const copy = getReleaseCopy(locale);
      const pdf = await runReleaseStage(context, "pdf_generation", () =>
        createPhotographyReleasePdf({
          values: result.data,
          copy,
          sessionDate,
        }),
      );
      const photographerEmail =
        process.env.RELEASE_RECIPIENT_EMAIL ?? "info@boudoir.barcelona";
      await deliverRelease({
        ...context,
        releaseDate: sessionDate,
        pdf,
        filename: `photography-release-${sessionDate}.pdf`,
        photographerEmail,
        clientEmail: result.data.email,
        subject: copy.emailSubject,
        photographerText: (archiveName) =>
          `${copy.title}\n\n${copy.fullName}: ${result.data.fullName}\n${copy.email}: ${result.data.email}\n${copy.sessionDate}: ${sessionDate}\n\nArchive reference: ${archiveName}`,
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
