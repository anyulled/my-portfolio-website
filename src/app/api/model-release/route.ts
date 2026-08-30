import { getModelReleaseCopy } from "@/services/modelRelease/copy";
import { archiveReleasePdf } from "@/services/photographyRelease/archive";
import { createModelReleasePdf } from "@/services/modelRelease/pdf";
import {
  createModelReleaseSchema,
  getMadridDate,
} from "@/app/model-release/types";
import { locales } from "@/i18n/config";
import { sendEmail } from "@/services/mailer";
import chalk from "chalk";
import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
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

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const path = firstIssue?.path[0]?.toString() ?? "";
      return NextResponse.json(
        {
          success: false,
          message: getErrorMessage(firstIssue?.message ?? "", path, locale),
        },
        { status: 400 },
      );
    }

    const copy = getModelReleaseCopy(locale);
    const pdf = await createModelReleasePdf({
      values: result.data,
      copy,
      releaseDate,
    });
    const archiveName = await archiveReleasePdf(pdf, releaseDate, "model");
    const attachment = {
      filename: `model-release-${releaseDate}.pdf`,
      content: pdf,
      contentType: "application/pdf",
    };
    const photographerEmail =
      process.env.RELEASE_RECIPIENT_EMAIL ?? "info@boudoir.barcelona";
    const emailText = `${copy.title}\n\n${copy.fullName}: ${result.data.fullName}\n${copy.email}: ${result.data.email}\n${copy.releaseDate}: ${releaseDate}\n\nArchive reference: ${archiveName}`;

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

    const modelDelivery = await sendEmail({
      to: result.data.email,
      subject: copy.emailSubject,
      text: copy.successMessage,
      attachments: [attachment],
    });
    if (!modelDelivery) {
      return NextResponse.json(
        { success: false, message: copy.errorGeneric },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, message: copy.successMessage });
  } catch (error) {
    console.error(chalk.red("[ModelRelease] Submission error:"), error);
    return NextResponse.json(
      { success: false, message: getModelReleaseCopy("en").errorGeneric },
      { status: 500 },
    );
  }
}
