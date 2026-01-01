import FadeInTitle from "@/components/FadeInTitle";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Camera,
  CheckCircle,
  Heart,
  ImageIcon,
  MessageCircle,
} from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import Link from "next/link";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Our Process | Boudoir Photography Experience",
  description:
    "Discover our boudoir photography process from consultation to final delivery. Learn how we create a comfortable, empowering experience for every client.",
  keywords:
    "boudoir process, photography experience, consultation, photo session, image delivery",
};

export default async function OurProcessPage() {
  const t = await getTranslations("our_process");

  const steps = [
    {
      icon: MessageCircle,
      number: "01",
      title: t("steps.consultation.title"),
      description: t("steps.consultation.description"),
    },
    {
      icon: Calendar,
      number: "02",
      title: t("steps.planning.title"),
      description: t("steps.planning.description"),
    },
    {
      icon: Camera,
      number: "03",
      title: t("steps.session.title"),
      description: t("steps.session.description"),
    },
    {
      icon: ImageIcon,
      number: "04",
      title: t("steps.editing.title"),
      description: t("steps.editing.description"),
    },
    {
      icon: Heart,
      number: "05",
      title: t("steps.reveal.title"),
      description: t("steps.reveal.description"),
    },
    {
      icon: CheckCircle,
      number: "06",
      title: t("steps.delivery.title"),
      description: t("steps.delivery.description"),
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
          <p className="text-lg text-center text-foreground">{t("intro")}</p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <Card
                  key={index}
                  className="bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <span
                        className={`${arefRuqaa.className} text-4xl font-bold text-primary/30 mr-4`}
                      >
                        {step.number}
                      </span>
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-primary-foreground" />
                      </div>
                    </div>
                    <h3
                      className={`${arefRuqaa.className} text-lg font-semibold text-foreground mb-3`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="text-center bg-primary rounded-3xl p-8 md:p-12">
          <h3
            className={`${dancingScript.className} text-2xl md:text-3xl text-primary-foreground mb-4`}
          >
            {t("cta.title")}
          </h3>
          <p className="text-primary-foreground/90 mb-6 max-w-2xl mx-auto">
            {t("cta.text")}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/#book-session"
              className="inline-block bg-background hover:bg-background/90 text-foreground font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out hover:scale-105"
            >
              {t("cta.book_button")}
            </Link>
            <Link
              href="/pricing"
              className="inline-block border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary font-bold py-3 px-8 rounded-full transition-all duration-300"
            >
              {t("cta.pricing_button")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
