import { Dancing_Script, Aref_Ruqaa } from "next/font/google";
import { Check, Camera, Clock, Shirt, Video, UserRound, Image as Photo } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: " Pricing",
};

export default async function PricingPage() {
  const t = await getTranslations("pricing");
  const packages = [
    {
      name: t("boudoir_experience"),
      price: "350 €",
      image:
        "https://live.staticflickr.com/65535/54154502487_981fb48243_c_d.jpg",
      features: [
        {
          icon: <Photo className="w-5 h-5" />,
          text: `12 ${t("edited_photos")}`,
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
          text: `20 ${t("edited_photos")}`,
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
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <h1
          className={`${dancingScript.className} text-5xl md:text-7xl mb-4 text-center text-peach-fuzz-500`}
        >
          {t("pricing")}
        </h1>
        <p
          className={`${arefRuqaa.className} text-xl md:text-2xl text-neutral-800 dark:text-neutral-300 text-center mb-12`}
        >
          {t("discover_our_experiences")}
        </p>

        <div className="grid lg:grid-cols-2 gap-12">
          {packages.map((pkg, index) => (
            <div
              key={index}
              className="dark:bg-neutral-800 bg-neutral-100 rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row"
            >
              <div className="md:w-2/5 relative">
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
                    className={`${arefRuqaa.className} text-2xl md:text-3xl mb-2 text-white`}
                  >
                    {pkg.name}
                  </h2>
                  <p
                    className={`${dancingScript.className} text-4xl md:text-5xl text-white`}
                  >
                    {pkg.price}
                  </p>
                </div>
              </div>
              <div className="md:w-3/5 p-6 flex flex-col justify-between">
                <ul className="space-y-4 mb-6">
                  {pkg.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <span className="mr-2 text-peach-fuzz-500">
                        {feature.icon}
                      </span>
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>


                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                        className="w-full bg-peach-fuzz-600 hover:bg-peach-fuzz-700 text-white font-bold py-2 px-4 rounded transition duration-300"
                    >
                      {t("book_now")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-neutral-800 text-neutral-100">
                    <ContactForm/>
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
