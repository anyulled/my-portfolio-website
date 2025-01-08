"use server";

import { cookies, headers } from "next/headers";
import { defaultLocale, Locale } from "@/i18n/config";

const COOKIE_NAME = "NEXT_LOCALE";

export async function getUserLocale() {
  const headerLocale = (await headers())
    .get("accept-language")
    ?.split(",")
    .at(1)
    ?.substring(0, 2);
  return (
    (await cookies()).get(COOKIE_NAME)?.value ?? headerLocale ?? defaultLocale
  );
}

export async function setUserLocale(locale: Locale) {
  (await cookies()).set(COOKIE_NAME, locale);
}
