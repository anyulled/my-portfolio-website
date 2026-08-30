"use client";

import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  ClientInformationSection,
  ConsentSection,
  LegalSections,
  ReleaseDetailsSection,
  SignatureSection,
} from "./ReleaseFormSections";
import { ReleaseFormValues, releaseFormSchema } from "../types";

interface PhotographyReleaseFormProps {
  sessionDate: string;
}

const createReleaseFormData = (values: ReleaseFormValues, locale: string) => {
  const formData = new FormData();
  formData.append("fullName", values.fullName);
  formData.append("birthDate", values.birthDate);
  formData.append("documentNumber", values.documentNumber);
  formData.append("email", values.email);
  formData.append("phone", values.phone);
  formData.append("signature", values.signature);
  formData.append("agreement", String(values.agreement));
  formData.append("locale", locale);
  values.usagePermissions.forEach((permission) =>
    formData.append("usagePermissions", permission),
  );
  if (values.privacyLevel) formData.append("privacyLevel", values.privacyLevel);
  return formData;
};

const parseReleaseResponse = async (
  response: Response,
  genericError: string,
) => {
  const result: unknown = await response.json();
  const message =
    typeof result === "object" && result !== null && "message" in result
      ? String(result.message)
      : genericError;
  const success =
    typeof result === "object" && result !== null && "success" in result
      ? result.success === true
      : false;
  return { message, success };
};

const submitRelease = async (
  values: ReleaseFormValues,
  locale: string,
  genericError: string,
  setServerError: (message: string | null) => void,
  setSubmitted: (submitted: boolean) => void,
) => {
  setServerError(null);
  const formData = createReleaseFormData(values, locale);

  try {
    const response = await fetch("/api/photography-release", {
      method: "POST",
      body: formData,
    });
    const { message, success } = await parseReleaseResponse(
      response,
      genericError,
    );

    if (!response.ok || !success) {
      setServerError(message);
      return;
    }

    setSubmitted(true);
  } catch {
    setServerError(genericError);
  }
};

export const PhotographyReleaseForm = ({
  sessionDate,
}: PhotographyReleaseFormProps) => {
  const t = useTranslations("release_form");
  const locale = useLocale();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReleaseFormValues>({
    resolver: zodResolver(releaseFormSchema),
    defaultValues: {
      fullName: "",
      birthDate: "",
      documentNumber: "",
      email: "",
      phone: "",
      sessionDate,
      usagePermissions: [],
      privacyLevel: undefined,
      signature: "",
      agreement: false,
    },
  });
  const usagePermissions = useWatch({ control, name: "usagePermissions" });
  const privacyLevel = useWatch({ control, name: "privacyLevel" });
  const signature = useWatch({ control, name: "signature" });

  const onSubmit = (values: ReleaseFormValues) =>
    submitRelease(
      values,
      locale,
      t("error_generic"),
      setServerError,
      setSubmitted,
    );

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border bg-card p-8 text-center shadow-lg">
        <h2 className="mb-4 text-2xl font-semibold">{t("success_title")}</h2>
        <p>{t("success_message")}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto max-w-3xl space-y-8 rounded-xl border bg-card p-6 shadow-lg sm:p-8"
      noValidate
    >
      <ClientInformationSection register={register} errors={errors} t={t} />
      <ReleaseDetailsSection sessionDate={sessionDate} t={t} />
      <ConsentSection
        t={t}
        errors={errors}
        privacyLevel={privacyLevel}
        usagePermissions={usagePermissions}
        setValue={setValue}
      />
      <LegalSections t={t} />
      <SignatureSection
        t={t}
        register={register}
        errors={errors}
        signature={signature}
        sessionDate={sessionDate}
        setValue={setValue}
      />
      {serverError && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {serverError}
        </p>
      )}
      <Button type="submit" className="w-full py-6" disabled={isSubmitting}>
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
};
