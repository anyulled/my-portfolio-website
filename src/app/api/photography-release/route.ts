import { getReleaseCopy } from "@/services/photographyRelease/copy";
import { archiveReleasePdf } from "@/services/photographyRelease/archive";
import { createPhotographyReleasePdf } from "@/services/photographyRelease/pdf";
import {
  getMadridDate,
  releaseFormSchema,
} from "@/app/photography-release/types";
import { locales } from "@/i18n/config";
import { sendEmail } from "@/services/mailer";
import chalk from "chalk";
import { NextResponse } from "next/server";

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
  try {
    const formData = await request.formData();
    const submission = createSubmission(formData);
    const { locale, sessionDate, result } = submission;

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const path = firstIssue?.path[0]?.toString() ?? "";
      return NextResponse.json(
        {
          success: false,
          message: errorMessageFor(firstIssue?.message ?? "", path, locale),
        },
        { status: 400 },
      );
    }

    const copy = getReleaseCopy(locale);
    const pdf = await createPhotographyReleasePdf({
      values: result.data,
      copy,
      sessionDate,
    });
    const archiveName = await archiveReleasePdf(pdf, sessionDate);
    const attachment = {
      filename: `photography-release-${sessionDate}.pdf`,
      content: pdf,
      contentType: "application/pdf",
    };
    const photographerEmail =
      process.env.RELEASE_RECIPIENT_EMAIL ?? "info@boudoir.barcelona";
    const emailText = `${copy.title}\n\n${copy.fullName}: ${result.data.fullName}\n${copy.email}: ${result.data.email}\n${copy.sessionDate}: ${sessionDate}\n\nArchive reference: ${archiveName}`;

    const photographerDelivery = await sendEmail({
      to: photographerEmail,
      subject: copy.emailSubject,
      text: emailText,
      attachments: [attachment],
    });
    if (!photographerDelivery) {
      return NextResponse.json(
        { success: false, message: copy.errorGeneric },
        { status: 502 },
      );
    }

    const clientDelivery = await sendEmail({
      to: result.data.email,
      subject: copy.emailSubject,
      text: copy.successMessage,
      attachments: [attachment],
    });
    if (!clientDelivery) {
      return NextResponse.json(
        { success: false, message: copy.errorGeneric },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: copy.successMessage,
    });
  } catch (error) {
    console.error(chalk.red("[PhotographyRelease] Submission error:"), error);
    return NextResponse.json(
      { success: false, message: getReleaseCopy("en").errorGeneric },
      { status: 500 },
    );
  }
}
