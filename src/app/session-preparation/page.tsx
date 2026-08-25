import FadeInTitle from "@/components/FadeInTitle";
import { Card, CardContent } from "@/components/ui/card";
import {
  Brush,
  Check,
  Heart,
  ImageIcon,
  Music,
  Shirt,
  Sparkles,
  UserRoundPlus,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import Link from "next/link";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const pageUrl = "https://boudoir.barcelona/session-preparation";
const thumbnailUrl = "/images/session-preparation-og.png";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("session_preparation");
  const title = t("meta_title");
  const description = t("meta_description");

  return {
    title,
    description,
    keywords: t("meta_keywords"),
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "article",
      url: pageUrl,
      title,
      description,
      images: [
        { url: thumbnailUrl, width: 1731, height: 909, alt: t("image_alt") },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [thumbnailUrl],
    },
  };
}

const preparationGuideDefinitions = [
  {
    icon: Shirt,
    key: "lingerie",
  },
  {
    icon: Sparkles,
    key: "variety",
  },
  {
    icon: Brush,
    key: "skin",
  },
  {
    icon: Heart,
    key: "hair",
  },
  {
    icon: ImageIcon,
    key: "vision",
  },
  {
    icon: Music,
    key: "music",
  },
  {
    icon: UserRoundPlus,
    key: "relax",
  },
];

export default async function SessionPreparationPage() {
  const t = await getTranslations("session_preparation");
  const preparationGuides = preparationGuideDefinitions.map((guide) => ({
    ...guide,
    title: t(`guides.${guide.key}.title`),
    description: t(`guides.${guide.key}.description`),
  }));
  const checklist = [1, 2, 3, 4, 5].map((item) => t(`checklist.item${item}`));
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        name: t("how_to_name"),
        description: t("how_to_description"),
        image: `https://boudoir.barcelona${thumbnailUrl}`,
        totalTime: "PT30M",
        step: preparationGuides.map((guide, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: guide.title,
          text: guide.description,
        })),
      },
      {
        "@type": "WebPage",
        name: t("meta_title"),
        url: pageUrl,
        description: t("meta_description"),
        image: `https://boudoir.barcelona${thumbnailUrl}`,
      },
    ],
  };

  return (
    <main className="min-h-screen pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="container mx-auto px-4 py-16">
        <FadeInTitle>
          <p className="text-center text-sm uppercase tracking-[0.3em] text-primary">
            {t("eyebrow")}
          </p>
          <h1
            className={`${dancingScript.className} mt-4 text-center text-5xl text-foreground md:text-7xl`}
          >
            {t("title")}
          </h1>
        </FadeInTitle>

        <FadeInTitle duration={2} delay={0.3}>
          <p
            className={`${arefRuqaa.className} mx-auto mt-6 max-w-3xl text-center text-xl text-muted-foreground md:text-2xl`}
          >
            {t("intro")}
          </p>
        </FadeInTitle>

        <section
          className="mx-auto mt-16 max-w-5xl"
          aria-labelledby="guides-title"
        >
          <h2
            id="guides-title"
            className={`${arefRuqaa.className} mb-8 text-center text-3xl text-foreground md:text-4xl`}
          >
            {t("guide_title")}
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {preparationGuides.map((guide) => {
              const Icon = guide.icon;

              return (
                <Card key={guide.title} className="bg-card">
                  <CardContent className="flex gap-5 p-6 md:p-8">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h3
                        className={`${arefRuqaa.className} text-xl font-semibold text-foreground`}
                      >
                        {guide.title}
                      </h3>
                      <p className="mt-3 leading-7 text-muted-foreground">
                        {guide.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section
          className="mx-auto mt-16 max-w-3xl rounded-3xl bg-muted/50 p-8 md:p-12"
          aria-labelledby="checklist-title"
        >
          <div className="text-center">
            <h2
              id="checklist-title"
              className={`${dancingScript.className} text-4xl text-foreground md:text-5xl`}
            >
              {t("checklist_title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {t("checklist_intro")}
            </p>
          </div>
          <ul className="mx-auto mt-8 max-w-xl space-y-4">
            {checklist.map((item) => (
              <li key={item} className="flex items-start gap-3 text-foreground">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="mx-auto mt-16 max-w-4xl rounded-3xl bg-primary p-8 text-center md:p-12"
          aria-labelledby="reassurance-title"
        >
          <Heart
            className="mx-auto h-8 w-8 text-primary-foreground"
            aria-hidden="true"
          />
          <h2
            id="reassurance-title"
            className={`${dancingScript.className} mt-4 text-4xl text-primary-foreground md:text-5xl`}
          >
            {t("reassurance_title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-primary-foreground/90">
            {t("reassurance_body")}
          </p>
          <Link
            href="/#book-session"
            className="mt-8 inline-block rounded-full bg-background px-8 py-3 font-bold text-foreground transition-all duration-300 hover:scale-105 hover:bg-background/90"
          >
            {t("cta")}
          </Link>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/90">
            <Link href="/faq" className="underline underline-offset-4">
              {t("faq_link")}
            </Link>
            <Link href="/our-process" className="underline underline-offset-4">
              {t("process_link")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
