import {getRequestConfig} from "next-intl/server";
import {getUserLocale} from "@/services/locale";
import fs from 'fs/promises';
import path from 'path';

const FALLBACK_LOCALE = 'en';

async function getAvailableLocales(): Promise<string[]> {
  try {
    const messagesDir = path.join(process.cwd(), 'messages');
    const files = await fs.readdir(messagesDir);
    return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.basename(file, '.json'));
  } catch (error) {
    console.error('Error reading locales:', error);
    return [FALLBACK_LOCALE];
  }
}

export default getRequestConfig(async () => {
  const requestedLocale = await getUserLocale();
  const availableLocales = await getAvailableLocales();

  const locale = availableLocales.includes(requestedLocale)
      ? requestedLocale
      : FALLBACK_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});