import { contactFormSchema } from "@/services/contactValidation";
import { getContactCopy } from "@/services/contact/copy";
import { sendEMail } from "@/services/mailer";
import { locales, Locale } from "@/i18n/config";
import { NextResponse } from "next/server";

const getText = (formData: FormData, key: string): string =>
  formData.get(key)?.toString() ?? "";

const getLocale = (formData: FormData): Locale => {
  const requestedLocale = getText(formData, "locale");
  return locales.includes(requestedLocale as Locale)
    ? (requestedLocale as Locale)
    : "en";
};

const getErrorMessage = (
  issueMessage: string,
  path: string,
  locale: string,
) => {
  const copy = getContactCopy(locale);
  if (path === "name") {
    return copy.errorName;
  }
  if (path === "email") {
    return copy.errorEmail;
  }
  if (path === "message") {
    return issueMessage === "error_message_spaces"
      ? copy.errorMessageSpaces
      : copy.errorMessageMinLength;
  }
  return copy.errorGeneric;
};

const getErrorDetails = (error: unknown) => ({
  name: error instanceof Error ? error.name : "UnknownError",
  message: error instanceof Error ? error.message : String(error),
});

const logContactEvent = (
  event: string,
  requestId: string,
  vercelRequestId: string | undefined,
  level: "info" | "error",
  details: Record<string, unknown> = {},
) => {
  const payload = JSON.stringify({
    component: "contact",
    event,
    level,
    requestId,
    vercelRequestId,
    timestamp: new Date().toISOString(),
    ...details,
  });

  if (level === "error") {
    console.error(payload);
    return;
  }

  console.log(payload);
};

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const vercelRequestId = request.headers.get("x-vercel-id") ?? undefined;
  logContactEvent(
    "contact_submission_received",
    requestId,
    vercelRequestId,
    "info",
  );

  try {
    const formData = await request.formData();
    const locale = getLocale(formData);
    const values = {
      name: getText(formData, "name"),
      email: getText(formData, "email"),
      message: getText(formData, "message"),
    };
    const result = contactFormSchema.safeParse(values);
    const copy = getContactCopy(locale);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const path = firstIssue?.path[0]?.toString() ?? "";
      logContactEvent(
        "contact_validation_failed",
        requestId,
        vercelRequestId,
        "info",
      );
      return NextResponse.json(
        {
          success: false,
          message: getErrorMessage(firstIssue?.message ?? "", path, locale),
          requestId,
        },
        { status: 400 },
      );
    }

    const emailResult = await sendEMail(
      result.data.message,
      result.data.email,
      result.data.name,
    );

    if (emailResult == null) {
      logContactEvent(
        "contact_delivery_failed",
        requestId,
        vercelRequestId,
        "error",
      );
      return NextResponse.json(
        {
          success: false,
          message: copy.errorDelivery,
          requestId,
          retryable: true,
        },
        { status: 502 },
      );
    }

    logContactEvent(
      "contact_submission_completed",
      requestId,
      vercelRequestId,
      "info",
    );
    return NextResponse.json({
      success: true,
      message: copy.successMessage,
      requestId,
    });
  } catch (error) {
    logContactEvent(
      "contact_submission_failed",
      requestId,
      vercelRequestId,
      "error",
      { error: getErrorDetails(error) },
    );
    return NextResponse.json(
      {
        success: false,
        message: getContactCopy("en").errorGeneric,
        requestId,
        retryable: true,
      },
      { status: 500 },
    );
  }
}
