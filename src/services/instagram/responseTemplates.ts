import type { ResponseRoute } from "./types";

type SupportedLocale = "en" | "es" | "fr" | "ca" | "it" | "uk";

const localeAliases: Record<SupportedLocale, string[]> = {
  en: ["en", "english", "anglais", "inglés", "inglese"],
  es: ["es", "spanish", "español", "espagnol", "spagnolo"],
  fr: ["fr", "french", "français", "francais", "francese"],
  ca: ["ca", "catalan", "català", "catalan"],
  it: ["it", "italian", "italiano", "italien"],
  uk: ["uk", "ukrainian", "українська", "ucraniano"],
};

const templates: Record<SupportedLocale, Record<ResponseRoute, string>> = {
  en: {
    model_form:
      "Thanks for reaching out. Please complete this form with your availability, rates, and photography conditions so I can review your proposal: ",
    pricing:
      "Thanks for your interest. You can find the available photography packages and prices here: ",
    manual_review: "",
  },
  es: {
    model_form:
      "Gracias por escribirme. Por favor, completa este formulario con tu disponibilidad, tarifas y condiciones fotográficas para que pueda revisar tu propuesta: ",
    pricing:
      "Gracias por tu interés. Puedes consultar aquí los paquetes y precios de fotografía disponibles: ",
    manual_review: "",
  },
  fr: {
    model_form:
      "Merci pour votre message. Veuillez remplir ce formulaire avec vos disponibilités, tarifs et conditions photographiques afin que je puisse étudier votre proposition : ",
    pricing:
      "Merci pour votre intérêt. Vous pouvez consulter les forfaits et tarifs de photographie disponibles ici : ",
    manual_review: "",
  },
  ca: {
    model_form:
      "Gràcies per escriure'm. Completa aquest formulari amb la teva disponibilitat, tarifes i condicions fotogràfiques perquè pugui revisar la teva proposta: ",
    pricing:
      "Gràcies pel teu interès. Pots consultar aquí els paquets i preus de fotografia disponibles: ",
    manual_review: "",
  },
  it: {
    model_form:
      "Grazie per avermi scritto. Compila questo modulo con la tua disponibilità, le tue tariffe e le condizioni fotografiche, così potrò valutare la tua proposta: ",
    pricing:
      "Grazie per il tuo interesse. Puoi consultare qui i pacchetti e i prezzi delle sessioni fotografiche disponibili: ",
    manual_review: "",
  },
  uk: {
    model_form:
      "Дякую за повідомлення. Будь ласка, заповніть цю форму, вказавши вашу доступність, тарифи та умови зйомки, щоб я міг розглянути вашу пропозицію: ",
    pricing:
      "Дякую за ваш інтерес. Переглянути доступні пакети та ціни на фотосесії можна тут: ",
    manual_review: "",
  },
};

export const normalizeResponseLocale = (language: string): SupportedLocale => {
  const normalizedLanguage = language.trim().toLowerCase();
  const match = Object.entries(localeAliases).find(([, aliases]) =>
    aliases.some(
      (alias) =>
        normalizedLanguage === alias ||
        normalizedLanguage.startsWith(`${alias}-`),
    ),
  );
  return (match?.[0] as SupportedLocale | undefined) ?? "en";
};

export const renderBoundedResponse = (
  route: Exclude<ResponseRoute, "manual_review">,
  language: string,
  link: string,
) => {
  const locale = normalizeResponseLocale(language);
  const localizedTemplates =
    locale === "en"
      ? templates.en
      : locale === "es"
        ? templates.es
        : locale === "fr"
          ? templates.fr
          : locale === "ca"
            ? templates.ca
            : locale === "it"
              ? templates.it
              : templates.uk;
  const message =
    route === "model_form"
      ? localizedTemplates.model_form
      : localizedTemplates.pricing;
  return `${message}${link}`;
};
