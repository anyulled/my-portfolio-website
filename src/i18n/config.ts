export type Locale = (typeof locales)[number];

export const locales = ["en", "es", "fr", "ca", "it"] as const;
export const defaultLocale: Locale = "en";
