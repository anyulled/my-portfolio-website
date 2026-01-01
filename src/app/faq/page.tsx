import FadeInTitle from "@/components/FadeInTitle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import Link from "next/link";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "FAQ | Frequently Asked Questions",
  description:
    "Find answers to frequently asked questions about boudoir photography sessions. Learn about preparation, pricing, privacy, and what to expect.",
  keywords:
    "boudoir FAQ, photography questions, session preparation, boudoir privacy, pricing questions",
};

export default async function FAQPage() {
  const t = await getTranslations("faq");

  const faqCategories = [
    {
      title: t("categories.general.title"),
      items: [
        {
          question: t("categories.general.q1.question"),
          answer: t("categories.general.q1.answer"),
        },
        {
          question: t("categories.general.q2.question"),
          answer: t("categories.general.q2.answer"),
        },
        {
          question: t("categories.general.q3.question"),
          answer: t("categories.general.q3.answer"),
        },
      ],
    },
    {
      title: t("categories.preparation.title"),
      items: [
        {
          question: t("categories.preparation.q1.question"),
          answer: t("categories.preparation.q1.answer"),
        },
        {
          question: t("categories.preparation.q2.question"),
          answer: t("categories.preparation.q2.answer"),
        },
        {
          question: t("categories.preparation.q3.question"),
          answer: t("categories.preparation.q3.answer"),
        },
      ],
    },
    {
      title: t("categories.session.title"),
      items: [
        {
          question: t("categories.session.q1.question"),
          answer: t("categories.session.q1.answer"),
        },
        {
          question: t("categories.session.q2.question"),
          answer: t("categories.session.q2.answer"),
        },
        {
          question: t("categories.session.q3.question"),
          answer: t("categories.session.q3.answer"),
        },
      ],
    },
    {
      title: t("categories.privacy.title"),
      items: [
        {
          question: t("categories.privacy.q1.question"),
          answer: t("categories.privacy.q1.answer"),
        },
        {
          question: t("categories.privacy.q2.question"),
          answer: t("categories.privacy.q2.answer"),
        },
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

        <div className="max-w-3xl mx-auto space-y-12">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h3
                className={`${arefRuqaa.className} text-2xl font-semibold text-foreground mb-6`}
              >
                {category.title}
              </h3>
              <Accordion type="single" collapsible className="space-y-4">
                {category.items.map((item, itemIndex) => (
                  <AccordionItem
                    key={itemIndex}
                    value={`${categoryIndex}-${itemIndex}`}
                    className="border rounded-lg px-4 bg-card"
                  >
                    <AccordionTrigger className="text-left text-foreground hover:text-primary">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center bg-muted/50 rounded-2xl p-8">
          <h3
            className={`${dancingScript.className} text-2xl md:text-3xl text-foreground mb-4`}
          >
            {t("cta.title")}
          </h3>
          <p className="text-muted-foreground mb-6">{t("cta.text")}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/#book-session"
              className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out hover:scale-105"
            >
              {t("cta.contact_button")}
            </Link>
            <Link
              href="/our-process"
              className="inline-block border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold py-3 px-8 rounded-full transition-all duration-300"
            >
              {t("cta.process_button")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
