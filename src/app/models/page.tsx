import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import {
  getPublishedPortfolioCollections,
  getPublishedPortfolioModels,
} from "@/services/portfolio/public";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("portfolio");
  return {
    title: t("models_title"),
    description: t("models_description"),
    openGraph: {
      title: t("models_title"),
      description: t("models_description"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("models_title"),
      description: t("models_description"),
    },
  };
}

export default async function ModelsPage() {
  await connection();
  const [t, models, collections] = await Promise.all([
    getTranslations("portfolio"),
    getPublishedPortfolioModels(),
    getPublishedPortfolioCollections(),
  ]);
  const coverByModel = new Map<string, string>();
  for (const collection of collections) {
    const cover = collection.photos[0]?.publicUrl;
    if (!cover) continue;
    for (const model of collection.models) {
      if (!coverByModel.has(model.id)) coverByModel.set(model.id, cover);
    }
  }

  return (
    <main className="container mx-auto min-h-screen space-y-8 px-4 py-24">
      <header className="mx-auto max-w-3xl space-y-4 text-center">
        <h1 className="text-4xl font-semibold md:text-6xl">
          {t("models_title")}
        </h1>
        <p className="text-lg text-muted-foreground">{t("models_intro")}</p>
      </header>
      {models.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          {t("no_collections")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {models.map((model) => (
            <article key={model.id} className="group">
              <Link href={`/models/${model.slug}`} className="block">
                {coverByModel.get(model.id) && (
                  <Image
                    src={coverByModel.get(model.id) ?? ""}
                    alt={model.name}
                    width={600}
                    height={800}
                    className="h-80 w-full rounded-md object-cover transition-transform group-hover:scale-[1.02]"
                  />
                )}
                <h2 className="pt-3 text-lg font-medium">{model.name}</h2>
              </Link>
              <a
                className="text-sm text-muted-foreground underline"
                href={model.profileUrl}
                target="_blank"
                rel="noreferrer"
              >
                {model.profileUrl}
              </a>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
