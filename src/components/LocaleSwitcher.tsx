import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import LocaleSwitcherSelect from "./LocaleSwitcherSelect";

export default function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();

  // ⚡ Bolt: Memoize items array to prevent unnecessary re-renders of LocaleSwitcherSelect
  const items = useMemo(
    () => [
      {
        value: "en",
        label: t("en"),
      },
      {
        value: "es",
        label: t("es"),
      },
      {
        value: "fr",
        label: t("fr"),
      },
      {
        value: "ca",
        label: t("ca"),
      },
      {
        value: "it",
        label: t("it"),
      },
      {
        value: "uk",
        label: t("uk"),
      },
    ],
    [t],
  );

  return (
    <LocaleSwitcherSelect
      defaultValue={locale}
      items={items}
      label={t("label")}
    />
  );
}
