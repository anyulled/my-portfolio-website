import { getRequestConfig } from "next-intl/server";
import { getUserLocale } from "@/services/locale";
import chalk from "chalk";

const FALLBACK_LOCALE = "en";

export default getRequestConfig(async () => {
  const requestedLocale = await getUserLocale();
  const availableLocales = ["es", "en", "fr", "ca", "it", "uk"];

  const locale = availableLocales.includes(requestedLocale)
    ? requestedLocale
    : FALLBACK_LOCALE;

  let messages;
  try {
    console.warn("[ i18n ] Last resort");
    messages = (await import(`@/messages/${locale}.json`)).default;
    console.info(chalk.blue(`[ i18n ] Successfully loaded messages for locale: ${locale}`));
  } catch (importError) {
    console.error(`[ i18n ] Failed to import messages for locale ${locale}:`, importError);
    messages = {};
  }

  return {
    locale,
    messages
  };
});
