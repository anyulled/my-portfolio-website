import { useLocale, useTranslations } from "next-intl";
import LocaleSwitcherSelect from "./LocaleSwitcherSelect";

export default function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();

  return (
    <LocaleSwitcherSelect
      defaultValue={locale}
      items={[
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
          label: t("uk")
        }
      ]}
      label={t("label")}
    />
  );
}
