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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { openGraph } from "@/lib/openGraph";

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
        <h1
          className={`${dancingScript.className} text-5xl md:text-7xl mb-4 text-center`}
        >
          {t("pricing")}
        </h1>
        <h2
          className={`${arefRuqaa.className} text-xl md:text-2xl text-center mb-12`}
        >
          {t("discover_our_experiences")}
        </h2>

        <div className="grid lg:grid-cols-3 gap-2">
          {packages.map((pkg) => (
            <div
              key={pkg.name.replaceAll(" ", "-")}
              className="dark:bg-neutral-800 bg-neutral-100 rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row"
            >
              <div className="md:w-7/12 relative">
                <Image
                  src={pkg.image}
                  alt={pkg.name}
                  width={300}
                  height={400}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2
                    className={`${arefRuqaa.className} text-2xl md:text-3xl mb-2`}
                  >
                    {pkg.name}
                  </h2>
                  <p
                    className={`${dancingScript.className} text-4xl md:text-5xl text-mocha-mousse-200`}
                  >
                    {pkg.price}
                  </p>
                </div>
              </div>
              <div className="md:w-5/12 p-3 flex flex-col justify-between">
                <ul className="space-y-4 mb-6">
                  {pkg.features.map((feature) => (
                    <li
                      key={pkg.name.replaceAll(" ", "-").concat(feature.text)}
                      className="flex items-center ml-4"
                    >
                      <span className="mr-2 text-mocha-mousse-500">
                        {feature.icon}
                      </span>
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-mocha-mousse-600 hover:bg-mocha-mousse-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                      {t("book_now")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-neutral-800 text-neutral-100">
                    <ContactForm />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
