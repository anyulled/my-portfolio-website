import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import {
  Camera,
  Check,
  Clock,
  Image as Photo,
  Shirt,
  UserRound,
  Video,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { openGraph } from "@/lib/openGraph";
import AnimatedPackages from "@/components/AnimatedPackages";
import FadeInTitle from "@/components/FadeInTitle";
import { Offer, WithContext } from "schema-dts";

import { getPricing, PricingPackageRecord } from "@/lib/pricing";
import { getPhotosFromStorage } from "@/services/storage/photos";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

const defaultPricing = {
  express: 200,
  experience: 350,
  deluxe: 600,
} as const;

const formatPrice = (
  value: number | string | null | undefined,
  fallback: number,
) => {
  if (value === null || value === undefined) {
    return `${fallback} €`;
  }

  const parsed = typeof value === "string" ? Number(value) : value;
  if (Number.isFinite(parsed)) {
    return `${parsed} €`;
  }

  return `${fallback} €`;
};

export const metadata: Metadata = {
  title: " Pricing ",
  description:
    "Discover our pricing and book your experience today! We have three packages available: Express, Experience, and Deluxe Experience.",
  twitter: {
    title: "Pricing",
    description: "Discover our pricing and book your experience today!",
    images: [{ url: "pricing/opengraph-image", height: 1200, width: 630 }],
  },
  openGraph: {
    ...openGraph,
    type: "article",
    title: "Pricing",
    description: "Discover our pricing and book your experience today!",
    images: [{ url: "pricing/opengraph-image", height: 1200, width: 630 }],
  },
};

const getPackages = (
  t: (key: string) => string,
  latestPricing: PricingPackageRecord | null,
  images: [string, string, string],
) => [
    {
      name: t("boudoir_express"),
      price: formatPrice(latestPricing?.express_price, defaultPricing.express),
      image: images[0],
      features: [
        {
          icon: <Photo className="w-5 h-5" />,
          text: `12 ${t("edited_photos")}`,
        },
        {
          icon: <Camera className="w-5 h-5" />,
          text: `150 ${t("photos_hd")}`,
        },
        {
          icon: <Shirt className="w-5 h-5" />,
          text: `3 ${t("clothing_change")}`,
        },
        {
          icon: <Clock className="w-5 h-5" />,
          text: `2 ${t("hours_studio")}`,
        },
        {
          icon: <Check className="w-5 h-5" />,
          text: t("clothing_and_attrezzo"),
        },
      ],
    },
    {
      name: t("boudoir_experience"),
      price: formatPrice(latestPricing?.experience_price, defaultPricing.experience),
      image: images[1],
      features: [
        {
          icon: <Photo className="w-5 h-5" />,
          text: `18 ${t("edited_photos")}`,
        },
        {
          icon: <Shirt className="w-5 h-5" />,
          text: `4 ${t("clothing_change")}`,
        },
        {
          icon: <Clock className="w-5 h-5" />,
          text: `2 ${t("hours_studio")}`,
        },
        {
          icon: <Camera className="w-5 h-5" />,
          text: `200 ${t("photos_hd")}`,
        },
        {
          icon: <Check className="w-5 h-5" />,
          text: t("clothing_and_attrezzo"),
        },
      ],
    },
    {
      name: t("deluxe_experience"),
      price: formatPrice(latestPricing?.deluxe_price, defaultPricing.deluxe),
      image: images[2],
      features: [
        {
          icon: <Photo className="w-5 h-5" />,
          text: `24 ${t("edited_photos")}`,
        },
        { icon: <Video className="w-5 h-5" />, text: t("video") },
        {
          icon: <UserRound className="w-5 h-5" />,
          text: t("professional_makeup"),
        },
        {
          icon: <Shirt className="w-5 h-5" />,
          text: `4 ${t("clothing_change")}`,
        },
        {
          icon: <Clock className="w-5 h-5" />,
          text: `3 ${t("hours_studio")}`,
        },
        {
          icon: <Camera className="w-5 h-5" />,
          text: `200 ${t("photos_hd")}`,
        },
        {
          icon: <Check className="w-5 h-5" />,
          text: t("clothing_and_attrezzo"),
        },
      ],
    },
  ];

export default async function PricingPage() {
  const t = await getTranslations("pricing");
  const latestPricing = await getPricing();
  const pricingPhotos = (await getPhotosFromStorage("pricing")) || [];

  // Shuffle photos to get random selection
  const shuffledPhotos = [...pricingPhotos].sort(() => 0.5 - Math.random());

  // Ensure we have at least 3 photos
  const getPhotoUrl = (index: number) => {
    if (shuffledPhotos.length === 0) return "";
    return shuffledPhotos[index % shuffledPhotos.length]?.urlLarge || "";
  };

  const images: [string, string, string] = [
    getPhotoUrl(0),
    getPhotoUrl(1),
    getPhotoUrl(2),
  ];

  const packages = getPackages(
    t as unknown as (key: string) => string,
    latestPricing,
    images,
  );

  const structuredData: WithContext<Offer>[] = packages.map((pkg) => ({
    "@context": "https://schema.org",
    "@type": "Offer",
    name: pkg.name,
    price: pkg.price.replace(" €", ""),
    priceCurrency: "EUR",
    image: pkg.image,
    description: pkg.features.map((f) => f.text).join(", "),
    availability: "https://schema.org/InStock",
    url: "https://boudoir.barcelona/pricing",
  }));

  return (
    <div className="min-h-screen pt-24">
      <div className="container mx-auto px-4 py-16">
        <FadeInTitle>
          <h1
            className={`${dancingScript.className} text-5xl md:text-7xl mb-4 text-center`}
          >
            {t("pricing")}
          </h1>
        </FadeInTitle>
        <FadeInTitle duration={2} delay={0.5}>
          <h2
            className={`${arefRuqaa.className} text-xl md:text-2xl text-center mb-12`}
          >
            {t("discover_our_experiences")}
          </h2>
        </FadeInTitle>

        <AnimatedPackages packages={packages} bookNowText={t("book_now")} />

        <div className="mt-16">
          <FadeInTitle>
            <h2
              className={`${arefRuqaa.className} text-2xl md:text-3xl mb-6 text-center`}
            >
              {t("general_conditions")}
            </h2>
          </FadeInTitle>
          <div className="dark:bg-neutral-800 bg-neutral-100 rounded-lg shadow-lg p-6">
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="mr-2 text-mocha-mousse-500 mt-1">
                  <Check className="w-5 h-5" />
                </span>
                <span>{t("condition_release_form")}</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-mocha-mousse-500 mt-1">
                  <Check className="w-5 h-5" />
                </span>
                <span>{t("condition_deposit")}</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-mocha-mousse-500 mt-1">
                  <Check className="w-5 h-5" />
                </span>
                <span>{t("condition_payment")}</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-mocha-mousse-500 mt-1">
                  <Check className="w-5 h-5" />
                </span>
                <span>{t("condition_photos_sharing")}</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-mocha-mousse-500 mt-1">
                  <Check className="w-5 h-5" />
                </span>
                <span>{t("condition_late_arrival")}</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-mocha-mousse-500 mt-1">
                  <Check className="w-5 h-5" />
                </span>
                <span>{t("condition_additional_photos")}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </div>

  );
}
