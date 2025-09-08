import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import {
  Camera,
  Check,
  Clock,
  Image as Photo,
  Shirt,
  UserRound,
  Video
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { openGraph } from "@/lib/openGraph";
import AnimatedPackages from "@/components/AnimatedPackages";
import FadeInTitle from "@/components/FadeInTitle";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: " Pricing ",
  description: "Discover our pricing and book your experience today!",
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

export default async function PricingPage() {
  const t = await getTranslations("pricing");
  const packages = [
    {
      name: t("boudoir_express"),
      price: "200 €",
      image:
        "https://live.staticflickr.com/65535/53232949297_8eb88c70b6_c_d.jpg",
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
      price: "350 €",
      image:
        "https://live.staticflickr.com/65535/54154502487_981fb48243_c_d.jpg",
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
      price: "600 €",
      image:
        "https://live.staticflickr.com/65535/53307099860_93b77dd6dc_k_d.jpg",
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
          <div
            className="dark:bg-neutral-800 bg-neutral-100 rounded-lg shadow-lg p-6">
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
    </div>
  );
}
