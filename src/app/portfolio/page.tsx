import PortfolioCollectionCard from "@/components/portfolio/PortfolioCollectionCard";
import { getPublishedPortfolioCollections } from "@/services/portfolio/public";
import { connection } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import type { PortfolioStyle } from "@/services/portfolio/types";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("portfolio");
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function PortfolioPage() {
  await connection();
  const [t, locale, collections] = await Promise.all([
    getTranslations("portfolio"),
    getLocale(),
    getPublishedPortfolioCollections(),
  ]);
  const styleLabels: Record<PortfolioStyle, string> = {
    portrait: t("portrait"),
    "artistic-nude": t("artistic_nude"),
    boudoir: t("boudoir"),
    glamour: t("glamour"),
    swimwear: t("swimwear"),
    fashion: t("fashion"),
    lifestyle: t("lifestyle"),
  };

  return (
    <main className="container mx-auto min-h-screen space-y-8 px-4 py-24">
      <header className="mx-auto max-w-3xl space-y-4 text-center">
        <h1 className="text-4xl font-semibold md:text-6xl">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">{t("intro")}</p>
      </header>
      {collections.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          {t("no_collections")}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <PortfolioCollectionCard
              key={collection.id}
              collection={collection}
              locale={locale}
              styleLabel={styleLabels[collection.style]}
              viewLabel={t("view_collection")}
            />
          ))}
        </div>
      )}
    </main>
  );
}
