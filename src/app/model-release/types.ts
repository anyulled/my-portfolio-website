import { z } from "zod";
import {
  calculateAge,
  isValidDate,
  isValidPhone,
} from "@/services/release/common";

export {
  calculateAge,
  getMadridDate,
  isValidDate,
  isValidPhone,
  PHOTOGRAPHER,
} from "@/services/release/common";

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
  errorReference: string;
  emailSubject: string;
};

export const RELEASE_LOCATION = "Barcelona, Spain";
