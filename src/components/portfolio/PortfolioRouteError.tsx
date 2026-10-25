"use client";

import { useTranslations } from "next-intl";

interface PortfolioRouteErrorProps {
  retry: () => void;
}

export default function PortfolioRouteError({
  retry,
}: PortfolioRouteErrorProps) {
  const t = useTranslations("portfolio");

  return (
    <main
      role="alert"
      className="container mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-6 py-20 text-center"
    >
      <h1 className="text-3xl font-semibold">{t("unavailable_title")}</h1>
      <p className="text-muted-foreground">{t("unavailable_description")}</p>
      <button
        type="button"
        className="rounded-md border px-4 py-2"
        onClick={retry}
      >
        {t("retry")}
      </button>
    </main>
  );
}
