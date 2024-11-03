export type Locale = (typeof locales)[number];

export const locales = ["en", "es", "fr", "ca"] as const;
export const defaultLocale: Locale = "en";
