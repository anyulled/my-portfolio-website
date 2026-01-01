import FadeInTitle from "@/components/FadeInTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Shirt, Sparkles, Star } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import Link from "next/link";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Style Guide | Boudoir Session Preparation",
  description:
    "Prepare for your boudoir session with our comprehensive style guide. Tips on wardrobe, makeup, and what to expect for your empowering experience.",
  keywords:
    "boudoir style guide, session preparation, wardrobe tips, boudoir photography tips",
};

export default async function StyleGuidePage() {
  const t = await getTranslations("style_guide");

  const tips = [
    {
      icon: Shirt,
      title: t("wardrobe.title"),
      items: [
        t("wardrobe.item1"),
        t("wardrobe.item2"),
        t("wardrobe.item3"),
        t("wardrobe.item4"),
      ],
    },
    {
      icon: Sparkles,
      title: t("beauty.title"),
      items: [
        t("beauty.item1"),
        t("beauty.item2"),
        t("beauty.item3"),
        t("beauty.item4"),
      ],
    },
    {
      icon: Star,
      title: t("day_of.title"),
      items: [
        t("day_of.item1"),
        t("day_of.item2"),
        t("day_of.item3"),
        t("day_of.item4"),
      ],
    },
  ];

  return (
    <div className="min-h-screen pt-24">
      <div className="container mx-auto px-4 py-16">
        <FadeInTitle>
          <h1
            className={`${dancingScript.className} text-5xl md:text-7xl mb-4 text-center text-foreground`}
          >
            {t("title")}
          </h1>
        </FadeInTitle>
        <FadeInTitle duration={2} delay={0.5}>
          <h2
            className={`${arefRuqaa.className} text-xl md:text-2xl text-center mb-12 text-muted-foreground`}
          >
            {t("subtitle")}
          </h2>
        </FadeInTitle>

        <div className="max-w-4xl mx-auto mb-16">
          <p className="text-lg text-center text-foreground mb-8">
            {t("intro")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {tips.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <Card
                key={index}
                className="bg-card hover:shadow-xl transition-shadow duration-300"
              >
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconComponent className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3
                    className={`${arefRuqaa.className} text-xl font-semibold text-foreground text-center mb-4`}
                  >
                    {section.title}
                  </h3>
                  <ul className="space-y-3">
                    {section.items.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="flex items-start text-muted-foreground"
                      >
                        <Check className="h-5 w-5 text-primary mr-2 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center bg-primary/10 rounded-2xl p-8">
          <h3
            className={`${dancingScript.className} text-2xl md:text-3xl text-foreground mb-4`}
          >
            {t("cta.title")}
          </h3>
          <p className="text-muted-foreground mb-6">{t("cta.text")}</p>
          <Link
            href="/#book-session"
            className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out hover:scale-105"
          >
            {t("cta.button")}
          </Link>
        </div>
      </div>
    </div>
  );
}
