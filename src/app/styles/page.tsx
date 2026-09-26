import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import {
  portfolioStyles,
  type PortfolioStyle,
} from "@/services/portfolio/types";
import { getPortfolioStyleMessageKey } from "@/lib/portfolioStyleLabel";
import {
  getPublishedPortfolioCollections,
  getPublishedPortfolioStyles,
} from "@/services/portfolio/public";

export const metadata: Metadata = {
  title: "Photography Styles",
  description:
    "Explore private boudoir photography styles in Barcelona, from soft and romantic to bold and editorial, and find the visual approach that feels most like you.",
  openGraph: {
    title: "Photography Styles",
    description:
      "Explore private boudoir photography styles in Barcelona, from soft and romantic to bold and editorial, and find the visual approach that feels most like you.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Photography Styles",
    description:
      "Explore private boudoir photography styles in Barcelona, from soft and romantic to bold and editorial, and find the visual approach that feels most like you.",
  },
};

export default async function PhotographyStylesPage() {
  await connection();
  const [t, activeStyles, collections] = await Promise.all([
    getTranslations("portfolio"),
    getPublishedPortfolioStyles(),
    getPublishedPortfolioCollections(),
  ]);
  const active = new Set(activeStyles);
  const coverByStyle = new Map<PortfolioStyle, string>();
  for (const collection of collections) {
    const cover = collection.photos[0]?.publicUrl;
    if (cover && !coverByStyle.has(collection.style)) {
      coverByStyle.set(collection.style, cover);
    }
  }

  return (
    <main className="container mx-auto min-h-screen space-y-8 px-4 py-24">
      <header className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-semibold md:text-6xl">
          {t("styles_title")}
        </h1>
      </header>
      {active.size === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          {t("no_collections")}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {portfolioStyles
            .filter((style) => active.has(style))
            .map((style) => (
              <Link
                key={style}
                href={`/styles/${style}`}
                className="group relative overflow-hidden rounded-lg"
              >
                {coverByStyle.has(style) && (
                  <Image
                    src={coverByStyle.get(style) ?? ""}
                    alt={t(getPortfolioStyleMessageKey(style))}
                    width={900}
                    height={1200}
                    className="h-[28rem] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                )}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-5 pb-5 pt-16 text-2xl font-semibold text-white">
                  {t(getPortfolioStyleMessageKey(style))}
                </span>
              </Link>
            ))}
        </div>
      )}
    </main>
  );
}
