import ca from "@/messages/ca.json";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import it from "@/messages/it.json";
import uk from "@/messages/uk.json";
import { locales, Locale } from "@/i18n/config";
import type { ModelReleaseCopy } from "@/app/model-release/types";

const localizedForms = {
  ca: ca.model_release,
  en: en.model_release,
  es: es.model_release,
  fr: fr.model_release,
  it: it.model_release,
  uk: uk.model_release,
} satisfies Record<Locale, Record<string, string>>;

const formForLocale = (locale: Locale): Record<string, string> => {
  switch (locale) {
    case "ca":
      return localizedForms.ca;
    case "en":
      return localizedForms.en;
    case "es":
      return localizedForms.es;
    case "fr":
      return localizedForms.fr;
    case "it":
      return localizedForms.it;
    case "uk":
      return localizedForms.uk;
  }
};

export const getModelReleaseCopy = (locale: string): ModelReleaseCopy => {
  const selectedLocale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : "en";
  const source = formForLocale(selectedLocale);

  return {
    title: source.title,
    intro: source.intro,
    modelInformation: source.model_information,
    fullName: source.full_name,
    birthDate: source.birth_date,
    documentNumber: source.document_number,
    email: source.email,
    phone: source.phone,
    gender: source.gender,
    address: source.address,
    city: source.city,
    state: source.state,
    country: source.country,
    postalCode: source.postal_code,
    releaseDetails: source.release_details,
    photographer: source.photographer,
    photographerId: source.photographer_id,
    releaseDate: source.release_date,
    location: source.location,
    photographerSignature: source.photographer_signature,
    preamble: source.preamble,
    clauses: [
      { title: source.clause_1_title, text: source.clause_1_text },
      { title: source.clause_2_title, text: source.clause_2_text },
      { title: source.clause_3_title, text: source.clause_3_text },
      { title: source.clause_4_title, text: source.clause_4_text },
      { title: source.clause_5_title, text: source.clause_5_text },
      { title: source.clause_6_title, text: source.clause_6_text },
    ],
    signature: source.signature,
    modelSignature: source.model_signature,
    signatureHint: source.signature_hint,
    clearSignature: source.clear_signature,
    submit: source.submit,
    submitting: source.submitting,
    successTitle: source.success_title,
    successMessage: source.success_message,
    errorGeneric: source.error_generic,
    errorFullName: source.error_full_name,
    errorBirthDate: source.error_birth_date,
    errorAge: source.error_age,
    errorDocumentNumber: source.error_document_number,
    errorEmail: source.error_email,
    errorPhone: source.error_phone,
    errorSignature: source.error_signature,
    emailSubject: source.email_subject,
  };
};
