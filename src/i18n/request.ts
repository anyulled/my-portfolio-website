import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.

  const locale =
    headers().get("accept-language")?.split(",").at(1)?.substring(0, 2) ?? "en";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
