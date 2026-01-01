import { getUserLocale } from "@/services/locale";
import chalk from "chalk";
import { getRequestConfig } from "next-intl/server";

const FALLBACK_LOCALE = "en";

export default getRequestConfig(async () => {
  const requestedLocale = await getUserLocale();
  const availableLocales = ["es", "en", "fr", "ca", "it", "uk"];

  const locale = availableLocales.includes(requestedLocale)
    ? requestedLocale
    : FALLBACK_LOCALE;

  const messages: Record<string, unknown> = await (async () => {
    try {
      console.warn(
        chalk.green(`[ i18n ] loading messages for locale ${locale}`),
      );
      const modRaw: unknown = await import(`@/messages/${locale}.json`);
      const isMod = (
        val: unknown,
      ): val is { default: Record<string, unknown> } =>
        typeof val === "object" && val !== null && "default" in val;

      if (!isMod(modRaw)) {
        throw new Error(`Invalid message format for locale ${locale}`);
      }
      const mod = modRaw;
      console.info(
        chalk.green(
          `[ i18n ] Successfully loaded messages for locale: ${locale}`,
        ),
      );
      return mod.default;
    } catch (importError) {
      console.error(
        `[ i18n ] Failed to import messages for locale ${locale}:`,
        importError,
      );
      return {};
    }
  })();

  return {
    locale,
    messages,
  };
});
