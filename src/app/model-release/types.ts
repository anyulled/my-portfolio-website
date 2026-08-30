import { z } from "zod";

const optionalField = z.string().trim().max(160, { message: "error_optional" });

export const modelReleaseSchema = z.object({
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
  email: z
    .string()
    .trim()
    .pipe(z.email({ message: "error_email" })),
  phone: z
    .string()
    .trim()
    .refine((value) => isValidPhone(value), { message: "error_phone" }),
  gender: optionalField,
  address: optionalField,
  city: optionalField,
  state: optionalField,
  country: optionalField,
  postalCode: optionalField,
  signature: z
    .string()
    .startsWith("data:image/png;base64,", { message: "error_signature" }),
});

export type ModelReleaseFormValues = z.infer<typeof modelReleaseSchema>;

export const createModelReleaseSchema = (releaseDate: string) =>
  modelReleaseSchema.superRefine((data, context) => {
    if (data.birthDate > releaseDate) {
      context.addIssue({
        code: "custom",
        message: "error_birth_date",
        path: ["birthDate"],
      });
    } else if (calculateAge(data.birthDate, releaseDate) < 18) {
      context.addIssue({
        code: "custom",
        message: "error_age",
        path: ["birthDate"],
      });
    }
  });

export type ModelReleaseCopy = {
  title: string;
  intro: string;
  modelInformation: string;
  fullName: string;
  birthDate: string;
  documentNumber: string;
  email: string;
  phone: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  releaseDetails: string;
  photographer: string;
  photographerId: string;
  releaseDate: string;
  location: string;
  photographerSignature: string;
  preamble: string;
  clauses: { title: string; text: string }[];
  signature: string;
  modelSignature: string;
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
  errorSignature: string;
  emailSubject: string;
};

export const PHOTOGRAPHER = {
  name: "Anyul Led Rivas Oropeza",
  documentNumber: "60043650B",
} as const;

export const RELEASE_LOCATION = "Barcelona, Spain";

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
