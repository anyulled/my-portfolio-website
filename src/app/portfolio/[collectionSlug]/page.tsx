import PortfolioCollectionDetails from "@/components/portfolio/PortfolioCollectionDetails";
import { getPublishedPortfolioCollection } from "@/services/portfolio/public";
import type { PortfolioStyle } from "@/services/portfolio/types";
import { connection } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ collectionSlug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  await connection();
  const { collectionSlug } = await params;
  const collection = await getPublishedPortfolioCollection(collectionSlug);
  if (!collection) return {};
  const description = `${collection.style.replaceAll("-", " ")} photography by Anyul Rivas in ${collection.location}. Featuring ${collection.models.map((model) => model.name).join(", ")}.`;
  return {
    title: collection.name,
    description,
    openGraph: {
      title: collection.name,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: collection.name,
      description,
    },
  };
}

export default async function PortfolioCollectionPage({ params }: PageProps) {
  await connection();
  const [{ collectionSlug }, t, locale] = await Promise.all([
    params,
    getTranslations("portfolio"),
    getLocale(),
  ]);
  const collection = await getPublishedPortfolioCollection(collectionSlug);
  if (!collection) notFound();
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
    <PortfolioCollectionDetails
      collection={collection}
      locale={locale}
      styleLabel={styleLabels[collection.style]}
      labels={{
        date: t("session_date"),
        location: t("location"),
        style: t("style"),
        brand: t("brand"),
        models: t("models"),
      }}
    />
  );
}
