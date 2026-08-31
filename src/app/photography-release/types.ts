import { z } from "zod";

export const USAGE_PERMISSIONS = [
  "web",
  "social",
  "print",
  "magazine",
  "exhibitions",
] as const;

export const PRIVACY_LEVELS = ["full", "cropped", "anonymous"] as const;

export const releaseFormSchema = z
  .object({
    fullName: z.string().trim().min(2, { message: "error_full_name" }),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "error_birth_date" })
      .refine((value) => isValidDate(value), { message: "error_birth_date" }),
    documentNumber: z
      .string()
      .trim()
      .regex(/^[\p{L}\p{N}][\p{L}\p{N}\s./-]{4,31}$/u, {
        message: "error_document_number",
      }),
    email: z.email({ message: "error_email" }),
    phone: z
      .string()
      .trim()
      .refine((value) => isValidPhone(value), { message: "error_phone" }),
    sessionDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "error_session_date" })
      .refine((value) => isValidDate(value), {
        message: "error_session_date",
      }),
    usagePermissions: z.array(z.enum(USAGE_PERMISSIONS)),
    privacyLevel: z.enum(PRIVACY_LEVELS).optional(),
    signature: z
      .string()
      .startsWith("data:image/png;base64,", { message: "error_signature" }),
  })
  .superRefine((data, context) => {
    if (data.birthDate > data.sessionDate) {
      context.addIssue({
        code: "custom",
        message: "error_birth_date",
        path: ["birthDate"],
      });
    } else if (calculateAge(data.birthDate, data.sessionDate) < 18) {
      context.addIssue({
        code: "custom",
        message: "error_age",
        path: ["birthDate"],
      });
    }

    if (data.privacyLevel && data.usagePermissions.length === 0) {
      context.addIssue({
        code: "custom",
        message: "error_privacy_without_permission",
        path: ["privacyLevel"],
      });
    }

    if (data.usagePermissions.length > 0 && !data.privacyLevel) {
      context.addIssue({
        code: "custom",
        message: "error_privacy_level",
        path: ["privacyLevel"],
      });
    }
  });

export type UsagePermission = (typeof USAGE_PERMISSIONS)[number];
export type PrivacyLevel = (typeof PRIVACY_LEVELS)[number];
export type ReleaseFormValues = z.infer<typeof releaseFormSchema>;

export type ReleaseCopy = {
  title: string;
  intro: string;
  photographer: string;
  photographerId: string;
  clientInformation: string;
  fullName: string;
  birthDate: string;
  documentNumber: string;
  email: string;
  phone: string;
  sessionDate: string;
  consentAndPrivacy: string;
  consentText: string;
  imageUsage: string;
  imageUsageIntro: string;
  usageWeb: string;
  usageSocial: string;
  usagePrint: string;
  usageMagazine: string;
  usageExhibitions: string;
  privacyLevel: string;
  privacyIntro: string;
  privacyFull: string;
  privacyCropped: string;
  privacyAnonymous: string;
  revocation: string;
  revocationText: string;
  liability: string;
  liabilityText: string;
  jurisdiction: string;
  jurisdictionText: string;
  signature: string;
  clientSignature: string;
  photographerSignature: string;
  signatureHint: string;
  clearSignature: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successMessage: string;
  errorGeneric: string;
  errorFullName: string;
  errorBirthDate: string;
  errorAge: string;
  errorDocumentNumber: string;
  errorEmail: string;
  errorPhone: string;
  errorSessionDate: string;
  errorSignature: string;
  errorReference: string;
  errorPrivacyLevel: string;
  errorPrivacyWithoutPermission: string;
  emailSubject: string;
};

export const PHOTOGRAPHER = {
  name: "Anyul Led Rivas Oropeza",
  documentNumber: "60043650B",
} as const;

export const getMadridDate = (date = new Date()): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
};

export const isValidDate = (value: string): boolean => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const calculateAge = (
  birthDate: string,
  referenceDate: string,
): number => {
  const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
  const [referenceYear, referenceMonth, referenceDay] = referenceDate
    .split("-")
    .map(Number);
  const birthdayPassed =
    referenceMonth > birthMonth ||
    (referenceMonth === birthMonth && referenceDay >= birthDay);

  return referenceYear - birthYear - (birthdayPassed ? 0 : 1);
};

export const isValidPhone = (value: string): boolean => {
  const digits = value.replace(/\D/g, "");
  return (
    digits.length >= 7 && digits.length <= 15 && /^\+?[0-9\s().-]+$/.test(value)
  );
};
