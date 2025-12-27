import Image from "next/image";
import Link from "next/link";
import { Dancing_Script, Playfair_Display } from "next/font/google";
import { styles } from "@/data/styles";
import { getPhotosFromStorage } from "@/services/storage/photos";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

const playfair = Playfair_Display({ subsets: ["latin"] });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Our Photography styles",
  description: "Boudoir photography service in Barcelona",
};

export default async function PhotographyStylesPage() {
  const res = await getPhotosFromStorage("styles", 500);
  const t = await getTranslations("styles-index");

  const photoStyles: Array<{
    name: string;
    image: string;
    link: string;
  }> = styles.map((style) => ({
    name: style.tag.replace("-", " "),
    image:
      res?.filter((photo) =>
        photo.tags.split(" ").includes(style.tag.replace("-", "")),
      )[0]?.urlLarge ?? "",
    link: `styles/${style.name}`,
  }));

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <h1
          className={`${dancingScript.className} text-5xl md:text-7xl mb-4 text-center mt-4 text-mocha-mousse-500`}
        >
          {t("photography-styles")}
        </h1>
        <p
          className={`${playfair.className} text-xl md:text-2xl text-mocha-mousse-300 text-center mb-12`}
        >
          {t("discover-our-styles")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {photoStyles.map((style, index) => (
            <Link href={style.link} key={index + style.name} className="group">
              <div className="relative overflow-hidden rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105">
                <Image
                  src={style.image}
                  alt={`${style.name} photography`}
                  width={300}
                  height={400}
                  className="object-cover w-full h-[400px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2
                    className={`${playfair.className} text-2xl md:text-3xl text-mocha-mousse-500 group-hover:text-mocha-mousse-400 transition-colors duration-300 capitalize`}
                  >
                    {style.name}
                  </h2>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
