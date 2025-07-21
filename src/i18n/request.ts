import { getRequestConfig } from "next-intl/server";
import { getUserLocale } from "@/services/locale";
import fs from "fs/promises";
import path from "path";

const FALLBACK_LOCALE = "en";

export async function findMessagesDir(): Promise<{
  dir: string,
  files: string[]
}> {
  const possibleDirs = [
    path.join(process.cwd(), "messages"),
    path.join(__dirname, "../../../messages"),
    path.join(__dirname, "../../messages"),
    path.join(__dirname, "../messages"),
    path.resolve(process.cwd(), "messages")
  ];

  let files: string[] = [];
  let messagesDir = "";

  for (const dir of possibleDirs) {
    try {
      files = await fs.readdir(dir);
      messagesDir = dir;
      console.log(`[ i18n ] Successfully found messages directory at: ${messagesDir}`);
      break;
    } catch (e) {
      console.log(`[ i18n ] Directory not found: ${dir}`, e);
    }
  }

  if (!messagesDir) {
    console.error("[ i18n ] Could not find messages directory in any of the expected locations");
    return { dir: "", files: [] };
  }

  return { dir: messagesDir, files };
}

export async function getAvailableLocales(): Promise<string[]> {
  try {
    const { files } = await findMessagesDir();

    if (files.length === 0) {
      return [FALLBACK_LOCALE];
    }

    return files
      .filter(file => file.endsWith(".json"))
      .map(file => path.basename(file, ".json"));
  } catch (error) {
    console.error("[ i18n ] Error reading locales:", error);
    return [FALLBACK_LOCALE];
  }
}

export default getRequestConfig(async () => {
  const requestedLocale = await getUserLocale();
  const availableLocales = await getAvailableLocales();

  const locale = availableLocales.includes(requestedLocale)
    ? requestedLocale
    : FALLBACK_LOCALE;

  const { dir: messagesDir } = await findMessagesDir();

  let messages;

  if (messagesDir) {
    try {
      const filePath = path.join(messagesDir, `${locale}.json`);
      const fileContent = await fs.readFile(filePath, "utf8");
      messages = JSON.parse(fileContent);
      console.log(`[ i18n ] Successfully loaded messages for locale: ${locale}`);
    } catch (error) {
      console.error(`[ i18n ] Error loading messages for locale ${locale}:`, error);
      try {
        messages = (await import(`../../messages/${locale}.json`)).default;
      } catch (importError) {
        console.error(`[ i18n ] Failed to import messages for locale ${locale}:`, importError);
        messages = {};
      }
    }
  } else {
    try {
      messages = (await import(`../../messages/${locale}.json`)).default;
    } catch (importError) {
      console.error(`[ i18n ] Failed to import messages for locale ${locale}:`, importError);
      messages = {};
    }
  }

  return {
    locale,
    messages
  };
});
