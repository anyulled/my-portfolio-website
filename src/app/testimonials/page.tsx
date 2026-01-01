import TestimonialsHero from "@/app/testimonials/TestimonialHero";
import TestimonialsCTA from "@/app/testimonials/TestimonialsCTA";
import TestimonialCard from "@/components/TestimonialCard";
import { getTestimonials, Testimonial } from "@/lib/testimonials";
import { getPhotosFromStorage } from "@/services/storage/photos";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Aref_Ruqaa } from "next/font/google";
import { WebPage, WithContext } from "schema-dts";

export const metadata: Metadata = {
  title: "Client Testimonials",
  description:
    "Read authentic testimonials from our boudoir photography clients. Discover how our empowering sessions boost confidence and celebrate feminine beauty.",
  keywords:
    "boudoir photography testimonials, client reviews, empowering photography, confidence boost, feminine portraits",
  openGraph: {
    url: "https://boudoir.barcelona/testimonials",
    siteName: "Sensuelle Boudoir Photography",
    title: "Client Testimonials | Sensuelle Boudoir Photography",
    description:
      "Read authentic testimonials from our boudoir photography clients. Discover transformative experiences.",
    type: "website",
    images: [
      {
        url: "https://storage.googleapis.com/sensuelle-boudoir-homepage/andrea-cano-montull_54701383010_o.webp",
        width: 500,
        height: 333,
        alt: "Andrea Cano Montull",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Client Testimonials | Sensuelle Boudoir · Boudoir Photography in Barcelona",
    description:
      "Read authentic testimonials from our boudoir photography clients.",
    images: [
      "https://storage.googleapis.com/sensuelle-boudoir-homepage/andrea-cano-montull_54701383010_o.webp",
    ],
  },
};

const structuredData: WithContext<WebPage> = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Client Testimonials",
  description: "Authentic testimonials from boudoir photography clients",
  url: "https://boudoir.barcelona/testimonials",
  mainEntity: {
    "@type": "Organization",
    name: "Sensuelle Boudoir Photography",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      reviewCount: "50",
      bestRating: "5",
      worstRating: "4",
    },
  },
};

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

export default async function TestimonialsPage() {
  const testimonials: Testimonial[] = await getTestimonials();
  const heroPhotos = await getPhotosFromStorage("hero");
  const heroImage =
    heroPhotos?.[0]?.srcSet[0]?.src ||
    "https://storage.googleapis.com/sensuelle-boudoir-homepage/andrea-cano-montull_54701383010_o.webp";

  const t = await getTranslations("testimonials");

  const featuredTestimonials = testimonials.filter((t) => t.featured);
  const regularTestimonials = testimonials.filter((t) => !t.featured);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-background">
        <TestimonialsHero image={heroImage} />

        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2
              className={`${arefRuqaa.className} text-3xl md:text-4xl font-serif text-foreground mb-4`}
            >
              {t("what_our_clients_say")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("discover_transformative_experiences")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {featuredTestimonials.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                index={index}
              />
            ))}
          </div>
        </section>

        <TestimonialsCTA />

        {regularTestimonials.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-16">
            <h2
              className={`${arefRuqaa.className} text-2xl md:text-3xl font-serif text-foreground text-center mb-12`}
            >
              {t("more_client_stories")}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {regularTestimonials.map((testimonial, index) => (
                <TestimonialCard
                  key={testimonial.id}
                  testimonial={testimonial}
                  index={index + featuredTestimonials.length}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
