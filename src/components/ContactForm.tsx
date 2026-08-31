"use client";
import FadeInTitle from "@/components/FadeInTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import useAnalyticsEventTracker from "@/hooks/eventTracker";
import { toast } from "@/hooks/use-toast";
import { submitLeadForm } from "@/lib/gtag";
import { contactFormSchema } from "@/services/contactValidation";
import type { ContactFormValues } from "@/services/contactValidation";
import * as Sentry from "@sentry/nextjs";
import { useLocale, useTranslations } from "next-intl";
import { Aref_Ruqaa } from "next/font/google";
import React from "react";
import { siTelegram, siWhatsapp } from "simple-icons";

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
type ContactField = keyof ContactFormValues;
type FieldErrors = Partial<Record<ContactField, string>>;
type Translate = (key: string) => string;

interface ContactResponse {
  success: boolean;
  message: string;
}

const contactFields = ["name", "email", "message"] as const;

const isContactField = (value: unknown): value is ContactField =>
  typeof value === "string" &&
  contactFields.includes(value as (typeof contactFields)[number]);

const getContactValues = (formData: FormData) => ({
  name: formData.get("name")?.toString() ?? "",
  email: formData.get("email")?.toString() ?? "",
  message: formData.get("message")?.toString() ?? "",
});

const getLocalizedValidationErrors = (
  issues: ReadonlyArray<{
    path: ReadonlyArray<PropertyKey>;
    message: string;
  }>,
  translate: Translate,
): FieldErrors =>
  issues.reduce<FieldErrors>((errors, issue) => {
    const field = issue.path[0];
    if (!isContactField(field)) {
      return errors;
    }

    const message = translate(issue.message);
    switch (field) {
      case "name":
        return errors.name ? errors : { ...errors, name: message };
      case "email":
        return errors.email ? errors : { ...errors, email: message };
      case "message":
        return errors.message ? errors : { ...errors, message };
    }
  }, {});

const isContactResponse = (val: unknown): val is ContactResponse =>
  typeof val === "object" &&
  val !== null &&
  "success" in val &&
  typeof val.success === "boolean" &&
  "message" in val &&
  typeof val.message === "string";

interface ErrorTextProps {
  id: string;
  message?: string;
}

function ErrorText({ id, message }: Readonly<ErrorTextProps>) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

export default function ContactForm() {
  const gaEventTracker = useAnalyticsEventTracker("Contact");
  const locale = useLocale();
  const t = useTranslations("contact_form");
  const [sendingForm, setSendingForm] = React.useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [submissionError, setSubmissionError] = React.useState("");

  const clearFieldError = (field: ContactField) => {
    setSubmissionError("");
    setFieldErrors((current) => {
      switch (field) {
        case "name":
          return current.name ? { ...current, name: undefined } : current;
        case "email":
          return current.email ? { ...current, email: undefined } : current;
        case "message":
          return current.message ? { ...current, message: undefined } : current;
      }
    });
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const values = getContactValues(formData);
    const validation = contactFormSchema.safeParse(values);

    if (!validation.success) {
      const nextErrors = getLocalizedValidationErrors(
        validation.error.issues,
        t,
      );
      const firstError = Object.values(nextErrors)[0] ?? t("error_generic");
      setFieldErrors(nextErrors);
      setSubmissionError("");
      toast({
        title: t("error_title"),
        description: firstError,
        variant: "destructive",
      });
      gaEventTracker("form_submit", "validation_error");
      return;
    }

    setFieldErrors({});
    setSubmissionError("");
    formData.set("locale", locale);
    setSendingForm(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });

      const resultRaw: unknown = await res.json();
      if (!isContactResponse(resultRaw)) {
        throw new Error("Invalid response");
      }
      const result = resultRaw;

      if (result.success) {
        toast({
          title: t("success_title"),
          description: result.message,
        });
        formElement.reset();
        setSubmissionError("");
        submitLeadForm();
        gaEventTracker("form_submit", "success");
      } else {
        toast({
          title: t("error_title"),
          description: result.message || t("error_generic"),
          variant: "destructive",
        });
        setSubmissionError(result.message || t("error_generic"));
        gaEventTracker("form_submit", "error");
      }
    } catch (error) {
      toast({
        title: t("error_title"),
        description: t("error_generic"),
        variant: "destructive",
      });
      setSubmissionError(t("error_generic"));
      Sentry.captureException(error);
      gaEventTracker("form_submit", "error");
    } finally {
      setSendingForm(false);
    }
  };

  return (
    <section id="book-session" className="py-2">
      <div className="container mx-auto px-6">
        <FadeInTitle delay={1}>
          <h2
            className={`${arefRuqaa.className} text-3xl font-bold text-center mb-8`}
          >
            {t("contact_us")}
          </h2>
        </FadeInTitle>
        <form
          className="max-w-md mx-auto space-y-4"
          onSubmit={handleFormSubmit}
          noValidate
        >
          <div className="space-y-1">
            <label className="sr-only" htmlFor="contact-name">
              {t("name")}
            </label>
            <Input
              id="contact-name"
              type="text"
              name="name"
              placeholder={t("name")}
              required
              aria-invalid={fieldErrors.name ? true : undefined}
              aria-describedby={
                fieldErrors.name ? "contact-name-error" : undefined
              }
              onChange={() => clearFieldError("name")}
            />
            <ErrorText id="contact-name-error" message={fieldErrors.name} />
          </div>
          <div className="space-y-1">
            <label className="sr-only" htmlFor="contact-email">
              {t("email")}
            </label>
            <Input
              id="contact-email"
              type="email"
              name="email"
              placeholder={t("email")}
              required
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={
                fieldErrors.email ? "contact-email-error" : undefined
              }
              onChange={() => clearFieldError("email")}
            />
            <ErrorText id="contact-email-error" message={fieldErrors.email} />
          </div>
          <div className="space-y-1">
            <label className="sr-only" htmlFor="contact-message">
              {t("message")}
            </label>
            <Textarea
              id="contact-message"
              name="message"
              placeholder={t("message")}
              required
              minLength={200}
              aria-invalid={fieldErrors.message ? true : undefined}
              aria-describedby={
                fieldErrors.message
                  ? "contact-message-hint contact-message-error"
                  : "contact-message-hint"
              }
              onChange={() => clearFieldError("message")}
            />
            <p
              id="contact-message-hint"
              className="text-sm text-muted-foreground"
            >
              {t("message_hint")}
            </p>
            <ErrorText
              id="contact-message-error"
              message={fieldErrors.message}
            />
          </div>
          <Button
            disabled={sendingForm}
            type="submit"
            className="w-full text-bold bg-primary text-primary-foreground"
          >
            {sendingForm ? t("sending") : t("send_message")}
          </Button>
          <ErrorText id="contact-submission-error" message={submissionError} />
        </form>
        <div className="mt-8 flex justify-center space-x-4">
          <a
            href={"https://wa.me/34638802609"}
            target={"_blank"}
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              className={"bg-whatsapp text-neutral-100"}
            >
              <svg
                role="img"
                viewBox="0 0 24 24"
                className={"h-4 w-4 fill-white mr-1"}
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>WhatsApp</title>
                <path fill={"white"} d={siWhatsapp.path} />
              </svg>
              WhatsApp
            </Button>
          </a>
          <a
            href={"https://t.me/m/1f-erIOJMjhk"}
            target={"_blank"}
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              className={"bg-telegram text-neutral-100"}
            >
              <svg
                role="img"
                viewBox="0 0 24 24"
                className={"w-4 h-4 fill-white mr-1"}
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Telegram</title>
                <path fill={"white"} d={siTelegram.path} />
              </svg>
              Telegram
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
