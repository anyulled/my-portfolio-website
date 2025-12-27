import type { Metadata } from "next";
import MythsHero from "./MythsHero";
import MythsIntro from "./MythIntro";
import MythsList from "./MythsList";
import TruthSection from "./TruthSection";
import MythsCTA from "./MythsCTA";
import { Article, FAQPage, WithContext } from "schema-dts";
import { getPhotosFromStorage } from "@/services/storage/photos";

export const metadata: Metadata = {
  title: "5 Common Boudoir Photography Myths Debunked",
  description:
    "Discover the truth about boudoir photography. We debunk 5 common myths and misconceptions about intimate photography sessions, body positivity, and empowerment.",
  keywords:
    "boudoir photography myths, boudoir misconceptions, intimate photography facts, body positivity photography, boudoir photography truth, empowering photography, boudoir session reality",
  openGraph: {
    title: "5 Common Boudoir Photography Myths Debunked",
    description:
      "Separate fact from fiction about boudoir photography. Learn the truth behind common myths and misconceptions.",
    type: "article",
    locale: "en_US",
    url: "https://boudoir.barcelona/boudoir-myths",
    siteName: "Sensuelle Boudoir · Boudoir Photography in Barcelona",
    images: [
      {
        url: "/placeholder.svg?height=630&width=1200&text=Boudoir+Myths+Debunked",
        width: 1200,
        height: 630,
        alt: "Boudoir Photography Myths Debunked",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "5 Common Boudoir Photography Myths Debunked",
    description:
      "Learn the truth about boudoir photography and debunk common misconceptions.",
    images: [
      "/placeholder.svg?height=630&width=1200&text=Boudoir+Myths+Debunked",
    ],
  },
  alternates: {
    canonical: "https://boudoir.barcelona/boudoir-myths",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const structuredData: WithContext<Article> = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "5 Common Boudoir Photography Myths Debunked",
  description:
    "Discover the truth about boudoir photography by debunking 5 common myths and misconceptions",
  author: {
    "@type": "Organization",
    name: "Sensuelle Boudoir Photography",
  },
  publisher: {
    "@type": "Organization",
    name: "Sensuelle Boudoir Photography",
    logo: {
      "@type": "ImageObject",
      url: "https://boudoir.barcelona/logo.png",
    },
  },
  datePublished: "2025-08-15",
  dateModified: "2025-08-15",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://boudoir.barcelona/boudoir-myths",
  },
  image: {
    "@type": "ImageObject",
    url: "/placeholder.svg?height=630&width=1200&text=Boudoir+Myths+Debunked",
    width: "1200",
    height: "630",
  },
};

const faqStructuredData: WithContext<FAQPage> = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is boudoir photography only for young, thin women?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely not! Boudoir photography is for every woman, regardless of age, size, or body type. Every body is beautiful and deserves to be celebrated.",
      },
    },
    {
      "@type": "Question",
      name: "Is boudoir photography inappropriate or too revealing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Boudoir photography is tasteful, artistic, and always respects your comfort level. You control how much or how little you reveal, and professional photographers ensure elegant, classy results.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to be confident to do a boudoir shoot?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Not at all! Many clients start their session feeling nervous or self-conscious. The boudoir experience is designed to build confidence, not require it from the start.",
      },
    },
  ],
};

async function fetchPhotos() {
  return await getPhotosFromStorage("boudoir", 6);
}

export default async function BoudoirMythsPage() {
  const photos = await fetchPhotos();

  if (!photos) return null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      <div className="min-h-screen bg-cream-tan-50">
        {photos && photos.length > 5 && <MythsHero heroImage={photos[5]} />}
        <MythsIntro />
        <MythsList photos={photos} />
        <TruthSection />
        <MythsCTA />
      </div>
    </>
  );
}
