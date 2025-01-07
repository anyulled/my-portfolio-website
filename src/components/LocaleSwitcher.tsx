import { useLocale, useTranslations } from "next-intl";
import LocaleSwitcherSelect from "./LocaleSwitcherSelect";

export default function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();

  return (
    <LocaleSwitcherSelect
      defaultValue={locale}
      data-testid="localeSwitcher"
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
      ]}
      label={t("label")}
    />
  );
}
