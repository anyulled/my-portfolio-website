import ca from "@/messages/ca.json";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import it from "@/messages/it.json";
import uk from "@/messages/uk.json";
import { locales, Locale } from "@/i18n/config";

export interface ContactCopy {
  errorDelivery: string;
  errorEmail: string;
  errorGeneric: string;
  errorMessageMinLength: string;
  errorMessageSpaces: string;
  errorName: string;
  errorTitle: string;
  successMessage: string;
  successTitle: string;
}

const localizedContactForms = {
  ca: ca.contact_form,
  en: en.contact_form,
  es: es.contact_form,
  fr: fr.contact_form,
  it: it.contact_form,
  uk: uk.contact_form,
} satisfies Record<Locale, Record<string, string>>;

const contactFormForLocale = (locale: Locale) => {
  switch (locale) {
    case "ca":
      return localizedContactForms.ca;
    case "es":
      return localizedContactForms.es;
    case "fr":
      return localizedContactForms.fr;
    case "it":
      return localizedContactForms.it;
    case "uk":
      return localizedContactForms.uk;
    case "en":
      return localizedContactForms.en;
  }
};

export const getContactCopy = (locale: string): ContactCopy => {
  const selectedLocale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : "en";
  const source = contactFormForLocale(selectedLocale);

  return {
    errorDelivery: source.error_delivery,
    errorEmail: source.error_email,
    errorGeneric: source.error_generic,
    errorMessageMinLength: source.error_message_min_length,
    errorMessageSpaces: source.error_message_spaces,
    errorName: source.error_name,
    errorTitle: source.error_title,
    successMessage: source.success_message,
    successTitle: source.success_title,
  };
};
