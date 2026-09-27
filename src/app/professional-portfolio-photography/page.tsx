import { getProfessionalPortfolioCopy } from "@/lib/professionalPortfolioCopy";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import EnquiryButton from "./EnquiryButton";

const canonical =
  "https://boudoir.barcelona/professional-portfolio-photography";
const reviewUrl = "https://g.page/r/CXYGEWUyinIwEBM/review";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const copy = getProfessionalPortfolioCopy(locale);

  return {
    title: copy.title,
    description: copy.intro,
    alternates: { canonical },
    openGraph: { title: copy.title, description: copy.intro, url: canonical },
  };
}

export default async function ProfessionalPortfolioPage() {
  const locale = (await getLocale()) as Locale;
  const copy = getProfessionalPortfolioCopy(locale);

  return (
    <main className="container mx-auto max-w-4xl space-y-8 px-6 py-16">
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold">{copy.title}</h1>
        <p className="text-lg">{copy.intro}</p>
      </div>
      <section className="space-y-4">
        <p>{copy.audience}</p>
        <p>{copy.session}</p>
        <p>{copy.privacy}</p>
      </section>
      <section className="space-y-4">
        <p>{copy.pricing}</p>
        <Link href="/pricing" className="text-primary underline">
          {copy.pricingLink}
        </Link>
      </section>
      <div className="flex flex-wrap items-center gap-6">
        <EnquiryButton label={copy.enquiry} />
        <a
          href={reviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          {copy.reviews}
        </a>
      </div>
    </main>
  );
}
