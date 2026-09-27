import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import EnquiryButton from "./EnquiryButton";

const canonical =
  "https://boudoir.barcelona/professional-portfolio-photography";
const reviewUrl = "https://g.page/r/CXYGEWUyinIwEBM/review";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("professional_portfolio");

  return {
    title: t("title"),
    description: t("intro"),
    alternates: { canonical },
    openGraph: { title: t("title"), description: t("intro"), url: canonical },
  };
}

export default async function ProfessionalPortfolioPage() {
  const t = await getTranslations("professional_portfolio");

  return (
    <main className="container mx-auto max-w-4xl space-y-8 px-6 py-16">
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold">{t("title")}</h1>
        <p className="text-lg">{t("intro")}</p>
      </div>
      <section className="space-y-4">
        <p>{t("audience")}</p>
        <p>{t("session")}</p>
        <p>{t("privacy")}</p>
      </section>
      <section className="space-y-4">
        <p>{t("pricing")}</p>
        <Link href="/pricing" className="text-primary underline">
          {t("pricingLink")}
        </Link>
      </section>
      <div className="flex flex-wrap items-center gap-6">
        <EnquiryButton label={t("enquiry")} />
        <a
          href={reviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          {t("reviews")}
        </a>
      </div>
    </main>
  );
}
