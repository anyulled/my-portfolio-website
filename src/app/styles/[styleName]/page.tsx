import PortfolioCollectionCard from "@/components/portfolio/PortfolioCollectionCard";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getPublishedPortfolioForStyle } from "@/services/portfolio/public";
import {
  portfolioStyles,
  type PortfolioStyle,
} from "@/services/portfolio/types";
import { getPortfolioStyleMessageKey } from "@/lib/portfolioStyleLabel";

type PageProps = { params: Promise<{ styleName: string }> };

const isPortfolioStyle = (style: string): style is PortfolioStyle =>
  portfolioStyles.includes(style as PortfolioStyle);

const getStyleLabel = async (style: string): Promise<string | null> => {
  if (!isPortfolioStyle(style)) return null;
  const t = await getTranslations("portfolio");
  return t(getPortfolioStyleMessageKey(style));
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  await connection();
  const [{ styleName }, t] = await Promise.all([
    params,
    getTranslations("portfolio"),
  ]);
  const label = await getStyleLabel(styleName);
  if (!label || !isPortfolioStyle(styleName)) return {};
  const description = t("style_description", { style: label });
  return {
    title: label,
    description,
    openGraph: { title: label, description, type: "website" },
    twitter: { card: "summary_large_image", title: label, description },
  };
}

export default async function StylePage({ params }: PageProps) {
  await connection();
  const [{ styleName }, t, locale] = await Promise.all([
    params,
    getTranslations("portfolio"),
    getLocale(),
  ]);
  if (!isPortfolioStyle(styleName)) notFound();
  const collections = await getPublishedPortfolioForStyle(styleName);
  if (collections.length === 0) notFound();
  return (
    <main className="container mx-auto min-h-screen space-y-8 px-4 py-24">
      <h1 className="text-4xl font-semibold md:text-6xl">
        {t(getPortfolioStyleMessageKey(styleName))}
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <PortfolioCollectionCard
            key={collection.id}
            collection={collection}
            locale={locale}
            styleLabel={t(getPortfolioStyleMessageKey(collection.style))}
            viewLabel={t("view_collection")}
          />
        ))}
      </div>
    </main>
  );
}
