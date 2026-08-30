import ca from "@/messages/ca.json";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import it from "@/messages/it.json";
import uk from "@/messages/uk.json";
import { locales, Locale } from "@/i18n/config";
import type { ReleaseCopy } from "@/app/photography-release/types";

const localizedReleaseForms = {
  ca: ca.release_form,
  en: en.release_form,
  es: es.release_form,
  fr: fr.release_form,
  it: it.release_form,
  uk: uk.release_form,
} satisfies Record<Locale, Record<string, string>>;

const releaseFormForLocale = (locale: Locale) => {
  switch (locale) {
    case "ca":
      return localizedReleaseForms.ca;
    case "es":
      return localizedReleaseForms.es;
    case "fr":
      return localizedReleaseForms.fr;
    case "it":
      return localizedReleaseForms.it;
    case "uk":
      return localizedReleaseForms.uk;
    case "en":
      return localizedReleaseForms.en;
  }
};

export const getReleaseCopy = (locale: string): ReleaseCopy => {
  const selectedLocale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : "en";
  const source = releaseFormForLocale(selectedLocale);

  return {
    title: source.title,
    intro: source.intro,
    photographer: source.photographer,
    photographerId: source.photographer_id,
    clientInformation: source.client_information,
    fullName: source.full_name,
    birthDate: source.birth_date,
    documentNumber: source.document_number,
    email: source.email,
    phone: source.phone,
    sessionDate: source.session_date,
    consentAndPrivacy: source.consent_and_privacy,
    consentText: source.consent_text,
    imageUsage: source.image_usage,
    imageUsageIntro: source.image_usage_intro,
    usageWeb: source.usage_web,
    usageSocial: source.usage_social,
    usagePrint: source.usage_print,
    usageMagazine: source.usage_magazine,
    usageExhibitions: source.usage_exhibitions,
    privacyLevel: source.privacy_level,
    privacyIntro: source.privacy_intro,
    privacyFull: source.privacy_full,
    privacyCropped: source.privacy_cropped,
    privacyAnonymous: source.privacy_anonymous,
    revocation: source.revocation,
    revocationText: source.revocation_text,
    liability: source.liability,
    liabilityText: source.liability_text,
    jurisdiction: source.jurisdiction,
    jurisdictionText: source.jurisdiction_text,
    signature: source.signature,
    clientSignature: source.client_signature,
    photographerSignature: source.photographer_signature,
    signatureHint: source.signature_hint,
    clearSignature: source.clear_signature,
    agreement: source.agreement,
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
    errorSessionDate: source.error_session_date,
    errorSignature: source.error_signature,
    errorAgreement: source.error_agreement,
    errorPrivacyLevel: source.error_privacy_level,
    errorPrivacyWithoutPermission: source.error_privacy_without_permission,
    emailSubject: source.email_subject,
  };
};
