import PortfolioCollectionCard from "@/components/portfolio/PortfolioCollectionCard";
import { getPublishedPortfolioForModel } from "@/services/portfolio/public";
import type { PortfolioStyle } from "@/services/portfolio/types";
import { connection } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ modelName: string }> };

const getModel = async (params: PageProps["params"]) => {
  const { modelName } = await params;
  return getPublishedPortfolioForModel(modelName);
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  await connection();
  const [model, t] = await Promise.all([
    getModel(params),
    getTranslations("portfolio"),
  ]);
  if (!model) return {};
  const description = t("model_description", { name: model.name });
  return {
    title: model.name,
    description,
    openGraph: { title: model.name, description, type: "profile" },
    twitter: { card: "summary_large_image", title: model.name, description },
  };
}

export default async function ModelPage({ params }: PageProps) {
  await connection();
  const [modelData, t, locale] = await Promise.all([
    getModel(params),
    getTranslations("portfolio"),
    getLocale(),
  ]);
  if (!modelData) notFound();
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
      <header className="space-y-4">
        <h1 className="text-4xl font-semibold md:text-6xl">{modelData.name}</h1>
        <a
          className="underline"
          href={modelData.profileUrl}
          target="_blank"
          rel="noreferrer"
        >
          {modelData.profileUrl}
        </a>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modelData.collections.map((collection) => (
          <PortfolioCollectionCard
            key={collection.id}
            collection={collection}
            locale={locale}
            styleLabel={styleLabels[collection.style]}
            viewLabel={t("view_collection")}
          />
        ))}
      </div>
    </main>
  );
}
