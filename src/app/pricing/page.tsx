import { Dancing_Script, Aref_Ruqaa} from "next/font/google";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

export default async function PricingPage() {
  const t = await getTranslations("pricing");
  const packages = [
    {
      name: t("boudoir_experience"),
      price: "350 €",
      features: [
        `12 ${t("edited_photos")}`,
        `4 ${t("clothing_change")}`,
        `2 ${t("hours_studio")}`,
        `200 ${t("photos_hd")}`,
        t("clothing_and_attrezzo"),
      ],
    },
    {
      name: t("deluxe_experience"),
      price: "600 €",
      features: [
        `20 ${t("edited_photos")}`,
        t("video"),
        t("professional_makeup"),
        `4 ${t("clothing_change")}`,
        `3 ${t("hours_studio")}`,
        `200 ${t("photos_hd")}`,
        t("clothing_and_attrezzo"),
      ],
    },
  ];
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <h1
          className={`${dancingScript.className} text-5xl md:text-7xl mb-4 text-center`}
        >
          {t("pricing")}
        </h1>
        <p
          className={`${arefRuqaa.className} text-xl md:text-2xl text-neutral-800 dark:text-neutral-300 text-center mb-12`}
        >
          {t("discover_our_experiences")}
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {packages.map((pkg, index) => (
            <div
              key={index}
              className="dark:bg-neutral-800 bg-neutral-200 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-r from-amber-700 to-amber-900">
                <h2
                  className={`${arefRuqaa.className} text-2xl md:text-3xl mb-2`}
                >
                  {pkg.name}
                </h2>
                <p
                  className={`${dancingScript.className} text-4xl md:text-5xl`}
                >
                  {pkg.price}
                </p>
              </div>
              <ul className="p-6 space-y-4">
                {pkg.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="w-5 h-5 mr-2 text-amber-500 flex-shrink-0 mt-1" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="p-6 pt-0">
                <button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                  {t("book_now")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
