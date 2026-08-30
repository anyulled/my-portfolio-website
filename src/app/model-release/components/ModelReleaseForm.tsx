"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import { SignaturePad } from "../../photography-release/components/SignaturePad";
import {
  createModelReleaseSchema,
  ModelReleaseFormValues,
  PHOTOGRAPHER,
  RELEASE_LOCATION,
} from "../types";

interface ModelReleaseFormProps {
  releaseDate: string;
}

const fields = [
  ["fullName", true],
  ["birthDate", true],
  ["documentNumber", true],
  ["email", true],
  ["phone", true],
  ["gender", false],
  ["address", false],
  ["city", false],
  ["state", false],
  ["country", false],
  ["postalCode", false],
] as const;

const optionalFields = new Set([
  "gender",
  "address",
  "city",
  "state",
  "country",
  "postalCode",
]);

const createFormData = (values: ModelReleaseFormValues, locale: string) => {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (key !== "signature") formData.append(key, value);
  });
  formData.append("signature", values.signature);
  formData.append("locale", locale);
  return formData;
};

const errorKey = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const translatedError = (
  translate: (key: string) => string,
  value: unknown,
) => {
  const key = errorKey(value);
  return key ? translate(key) : null;
};

const parseResponse = async (response: Response, genericError: string) => {
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

export const ModelReleaseForm = ({ releaseDate }: ModelReleaseFormProps) => {
  const t = useTranslations("model_release");
  const locale = useLocale();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ModelReleaseFormValues>({
    resolver: zodResolver(createModelReleaseSchema(releaseDate)),
    defaultValues: {
      fullName: "",
      birthDate: "",
      documentNumber: "",
      email: "",
      phone: "",
      gender: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      signature: "",
    },
  });

  const onSubmit = async (values: ModelReleaseFormValues) => {
    setServerError(null);
    try {
      const response = await fetch("/api/model-release", {
        method: "POST",
        body: createFormData(values, locale),
      });
      const result = await parseResponse(response, t("error_generic"));
      if (!response.ok || !result.success) {
        setServerError(result.message);
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError(t("error_generic"));
    }
  };

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
      <section className="space-y-4">
        <h2 className="border-b pb-2">{t("model_information")}</h2>
        <div className="space-y-4">
          {fields.map(([name, required]) => (
            <ModelField
              key={name}
              name={name}
              required={required}
              register={register}
              errors={errors}
              t={t}
            />
          ))}
        </div>
      </section>
      <section className="space-y-4 rounded-lg border bg-background/50 p-4">
        <h2>{t("release_details")}</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm">
          <Detail label={t("photographer")} value={PHOTOGRAPHER.name} />
          <Detail
            label={t("photographer_id")}
            value={PHOTOGRAPHER.documentNumber}
          />
          <Detail label={t("release_date")} value={releaseDate} />
          <Detail label={t("location")} value={RELEASE_LOCATION} />
        </dl>
      </section>
      <section className="space-y-4">
        <h2>{t("release_terms")}</h2>
        <p>{t("preamble")}</p>
        {[1, 2, 3, 4, 5, 6].map((number) => (
          <div key={number} className="space-y-2 text-sm leading-7">
            <h3 className="font-semibold">
              {number}. {t(`clause_${number}_title`)}
            </h3>
            <p>{t(`clause_${number}_text`)}</p>
          </div>
        ))}
      </section>
      <section className="space-y-4 border-t pt-6">
        <h2>{t("signature")}</h2>
        <SignaturePad
          id="model-signature"
          value=""
          onChange={(value) =>
            setValue("signature", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          label={t("model_signature")}
          hint={t("signature_hint")}
          clearLabel={t("clear_signature")}
          error={translatedError(t, errors.signature?.message) ?? undefined}
        />
        <div className="rounded-lg border bg-background/50 p-4 text-sm">
          <p className="font-medium">{t("photographer_signature")}</p>
          <p className="mt-2 font-[cursive] text-xl">{PHOTOGRAPHER.name}</p>
          <p className="mt-1 text-muted-foreground">{releaseDate}</p>
        </div>
      </section>
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

const ModelField = ({
  name,
  required,
  register,
  errors,
  t,
}: {
  name: keyof ModelReleaseFormValues;
  required: boolean;
  register: ReturnType<typeof useForm<ModelReleaseFormValues>>["register"];
  errors: FieldErrors<ModelReleaseFormValues>;
  t: (key: string) => string;
}) => {
  const type =
    name === "birthDate"
      ? "date"
      : name === "email"
        ? "email"
        : name === "phone"
          ? "tel"
          : "text";
  const error = translatedError(t, getFieldError(errors, name));
  return (
    <div className="space-y-2">
      <label htmlFor={`model-${name}`} className="text-sm font-medium">
        {t(
          name.replace(/[A-Z]/g, (character) => `_${character.toLowerCase()}`),
        )}
        {required ? " *" : ` (${t("optional")})`}
      </label>
      <Input
        id={`model-${name}`}
        {...register(name)}
        type={type}
        autoComplete={
          name === "fullName" ? "name" : optionalFields.has(name) ? "off" : name
        }
      />
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};

const getFieldError = (
  errors: FieldErrors<ModelReleaseFormValues>,
  name: keyof ModelReleaseFormValues,
) => Object.entries(errors).find(([key]) => key === name)?.[1]?.message;

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="font-medium">{value}</dd>
  </div>
);
