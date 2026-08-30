import { Input } from "@/components/ui/input";
import { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import {
  PHOTOGRAPHER,
  PRIVACY_LEVELS,
  ReleaseFormValues,
  USAGE_PERMISSIONS,
} from "../types";
import { SignaturePad } from "./SignaturePad";

interface ReleaseFieldsProps {
  register: UseFormRegister<ReleaseFormValues>;
  errors: FieldErrors<ReleaseFormValues>;
  t: (key: string) => string;
}

const usageLabelKey = (permission: (typeof USAGE_PERMISSIONS)[number]) => {
  switch (permission) {
    case "web":
      return "usage_web";
    case "social":
      return "usage_social";
    case "print":
      return "usage_print";
    case "magazine":
      return "usage_magazine";
    case "exhibitions":
      return "usage_exhibitions";
  }
};

const privacyLabelKey = (level: (typeof PRIVACY_LEVELS)[number]) => {
  switch (level) {
    case "full":
      return "privacy_full";
    case "cropped":
      return "privacy_cropped";
    case "anonymous":
      return "privacy_anonymous";
  }
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

export const toggleUsagePermission = (
  usagePermissions: (typeof USAGE_PERMISSIONS)[number][],
  permission: (typeof USAGE_PERMISSIONS)[number],
  setValue: UseFormSetValue<ReleaseFormValues>,
) => {
  const nextPermissions = usagePermissions.includes(permission)
    ? usagePermissions.filter((value) => value !== permission)
    : [...usagePermissions, permission];

  setValue("usagePermissions", nextPermissions, {
    shouldDirty: true,
    shouldValidate: true,
  });

  if (nextPermissions.length === 0) {
    setValue("privacyLevel", undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }
};

export const ClientInformationSection = ({
  register,
  errors,
  t,
}: ReleaseFieldsProps) => (
  <section className="space-y-4">
    <h2 className="border-b pb-2">{t("client_information")}</h2>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field
        id="full-name"
        label={t("full_name")}
        error={translatedError(t, errors.fullName?.message)}
      >
        <Input id="full-name" {...register("fullName")} autoComplete="name" />
      </Field>
      <Field
        id="birth-date"
        label={t("birth_date")}
        error={translatedError(t, errors.birthDate?.message)}
      >
        <Input id="birth-date" {...register("birthDate")} type="date" />
      </Field>
      <Field
        id="document-number"
        label={t("document_number")}
        error={translatedError(t, errors.documentNumber?.message)}
      >
        <Input
          id="document-number"
          {...register("documentNumber")}
          autoComplete="off"
        />
      </Field>
      <Field
        id="email"
        label={t("email")}
        error={translatedError(t, errors.email?.message)}
      >
        <Input
          id="email"
          {...register("email")}
          type="email"
          autoComplete="email"
        />
      </Field>
      <Field
        id="phone"
        label={t("phone")}
        error={translatedError(t, errors.phone?.message)}
      >
        <Input
          id="phone"
          {...register("phone")}
          type="tel"
          autoComplete="tel"
        />
      </Field>
    </div>
  </section>
);

export const ReleaseDetailsSection = ({
  sessionDate,
  t,
}: {
  sessionDate: string;
  t: (key: string) => string;
}) => (
  <section className="space-y-3 rounded-lg border bg-background/50 p-4">
    <h2>{t("release_details")}</h2>
    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
      <Detail label={t("photographer")} value={PHOTOGRAPHER.name} />
      <Detail
        label={t("photographer_id")}
        value={PHOTOGRAPHER.documentNumber}
      />
      <Detail label={t("session_date")} value={sessionDate} />
    </dl>
  </section>
);

export const ConsentSection = ({
  t,
  errors,
  privacyLevel,
  usagePermissions,
  setValue,
}: {
  t: (key: string) => string;
  errors: FieldErrors<ReleaseFormValues>;
  privacyLevel: ReleaseFormValues["privacyLevel"];
  usagePermissions: ReleaseFormValues["usagePermissions"];
  setValue: UseFormSetValue<ReleaseFormValues>;
}) => (
  <>
    <section className="space-y-3">
      <h2>1. {t("consent_and_privacy")}</h2>
      <p>{t("consent_text")}</p>
    </section>
    <section className="space-y-4">
      <h2>2. {t("image_usage")}</h2>
      <p>{t("image_usage_intro")}</p>
      <div className="space-y-3">
        {USAGE_PERMISSIONS.map((permission) => (
          <label key={permission} className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={usagePermissions.includes(permission)}
              onChange={() =>
                toggleUsagePermission(usagePermissions, permission, setValue)
              }
              className="mt-1 h-4 w-4 accent-primary"
            />
            <span>{t(usageLabelKey(permission))}</span>
          </label>
        ))}
      </div>
    </section>
    <section className="space-y-4">
      <h2>3. {t("privacy_level")}</h2>
      <p>{t("privacy_intro")}</p>
      <fieldset disabled={usagePermissions.length === 0} className="space-y-3">
        <legend className="sr-only">{t("privacy_level")}</legend>
        {PRIVACY_LEVELS.map((level) => (
          <label key={level} className="flex items-start gap-3 text-sm">
            <input
              type="radio"
              value={level}
              checked={privacyLevel === level}
              onChange={() =>
                setValue("privacyLevel", level, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              className="mt-1 h-4 w-4 accent-primary"
            />
            <span>{t(privacyLabelKey(level))}</span>
          </label>
        ))}
      </fieldset>
      {translatedError(t, errors.privacyLevel?.message) && (
        <p role="alert" className="text-xs text-destructive">
          {translatedError(t, errors.privacyLevel?.message)}
        </p>
      )}
    </section>
  </>
);

export const LegalSections = ({ t }: { t: (key: string) => string }) => (
  <>
    <section className="space-y-3">
      <h2>4. {t("revocation")}</h2>
      <p>{t("revocation_text")}</p>
    </section>
    <section className="space-y-3">
      <h2>5. {t("liability")}</h2>
      <p>{t("liability_text")}</p>
    </section>
    <section className="space-y-3">
      <h2>6. {t("jurisdiction")}</h2>
      <p>{t("jurisdiction_text")}</p>
    </section>
  </>
);

export const SignatureSection = ({
  t,
  register,
  errors,
  signature,
  sessionDate,
  setValue,
}: ReleaseFieldsProps & {
  signature: string;
  sessionDate: string;
  setValue: UseFormSetValue<ReleaseFormValues>;
}) => (
  <section className="space-y-4 border-t pt-6">
    <h2>{t("signature")}</h2>
    <SignaturePad
      value={signature}
      onChange={(value) =>
        setValue("signature", value, {
          shouldDirty: true,
          shouldValidate: true,
        })
      }
      label={t("client_signature")}
      hint={t("signature_hint")}
      clearLabel={t("clear_signature")}
      error={translatedError(t, errors.signature?.message) ?? undefined}
    />
    <div className="rounded-lg border bg-background/50 p-4 text-sm">
      <p className="font-medium">{t("photographer_signature")}</p>
      <p className="mt-2 font-[cursive] text-xl">{PHOTOGRAPHER.name}</p>
      <p className="mt-1 text-muted-foreground">{sessionDate}</p>
    </div>
    <label className="flex items-start gap-3 text-sm">
      <input
        type="checkbox"
        {...register("agreement")}
        className="mt-1 h-4 w-4 accent-primary"
      />
      <span>{t("agreement")}</span>
    </label>
    {translatedError(t, errors.agreement?.message) && (
      <p role="alert" className="text-xs text-destructive">
        {translatedError(t, errors.agreement?.message)}
      </p>
    )}
  </section>
);

const Field = ({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error: string | null;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="text-sm font-medium">
      {label} *
    </label>
    {children}
    {error && (
      <p role="alert" className="text-xs text-destructive">
        {error}
      </p>
    )}
  </div>
);

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="font-medium">{value}</dd>
  </div>
);
