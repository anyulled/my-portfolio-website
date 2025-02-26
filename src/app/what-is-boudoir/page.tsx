import Image from "next/image";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import { getFlickrPhotos } from "@/services/flickr/flickr";
import { Card, CardContent } from "@/components/ui/card";
import Gallery from "@/components/Gallery";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Suspense } from "react";
import Loading from "@/app/loading";
import { createFlickr } from "flickr-sdk";
import { Photo } from "@/services/flickr/flickr.types";

/*eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "What is Boudoir?",
};

function getRandomElements(arr: Photo[], num: number) {
  if (!arr) {
    return [];
  }
  const shuffled = arr.toSorted(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

export default async function BoudoirStylePage() {
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!);
  const { photos } = await getFlickrPhotos(flickr, "boudoir, model", 50);
  const randomPhotos = getRandomElements(photos ?? [], 10);
  const t = await getTranslations("what_is_boudoir");

  return (
    <>
      <header className="container mx-auto px-4 pt-24 pb-4 text-center">
        <h1 className={`${dancingScript.className} text-5xl md:text-7xl mb-4`}>
          {t("boudoir_photography")}
        </h1>
        <h2 className={`${arefRuqaa.className} text-xl md:text-2xl`}>
          {t("empowering")}
        </h2>
      </header>
      <main className="container mx-auto px-4 py-4">
        <section className="mb-16">
          <h2 className={`${arefRuqaa.className} text-3xl md:text-4xl mb-6`}>
            {t("what_is_boudoir")}
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-2/3">
              <p className="mb-4 prose lg:prose-xl">{t("p1")}</p>
              <p className={"prose lg:prose-xl"}>{t("p2")}</p>
            </div>
            <div className="md:w-1/3">
              <Image
                priority
                src={randomPhotos?.at(1)?.urlZoom!}
                blurDataURL={randomPhotos?.at(1)?.urlCrop!}
                placeholder="blur"
                alt={t("boudoir_photography")}
                width={600}
                height={400}
                className="rounded-lg shadow-lg h-auto w-full"
              />
            </div>
          </div>
        </section>
        <section className="mb-16">
          <h2 className={`${arefRuqaa.className} text-3xl md:text-4xl mb-6`}>
            {t("art_boudoir")}
          </h2>
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="md:w-2/3">
              <p className="mb-4 prose lg:prose-xl">{t("p3")}</p>
              <p className={"prose lg:prose-xl"}>{t("p4")}</p>
            </div>
            <div className="md:w-1/3">
              <Image
                priority
                src={randomPhotos?.at(2)?.urlZoom!}
                blurDataURL={randomPhotos?.at(2)?.urlCrop!}
                placeholder="blur"
                alt={t("boudoir_photography")}
                width={600}
                height={400}
                className="rounded-lg shadow-lg h-auto w-full"
              />
            </div>
          </div>
        </section>
        <section className="mb-16">
          <h2 className={`${arefRuqaa.className} text-3xl md:text-4xl mb-6`}>
            {t("why_boudoir")}
          </h2>
          <ul className="list-disc list-inside mb-8 ml-4">
            <li>{t("l1")}.</li>
            <li>{t("l2")}.</li>
            <li>{t("l3")}.</li>
            <li>{t("l4")}.</li>
            <li>{t("l5")}.</li>
          </ul>
          <Card>
            <CardContent>
              <Suspense fallback={<Loading />}>
                <Gallery photos={randomPhotos} showTitle={false} />
              </Suspense>
            </CardContent>
          </Card>
        </section>
        <section>
          <h2 className={`${arefRuqaa.className} text-3xl md:text-4xl mb-6`}>
            {t("boudoir_experience")}
          </h2>
          <p className="mb-4 prose lg:prose-xl">{t("p5")}</p>
          <p className="mb-8 prose lg:prose-xl">{t("p6")}</p>
          <div className="text-center">
            <Link
              href="/#book-session"
              className="inline-block bg-peach-fuzz-400 hover:bg-peach-fuzz-700 text-white font-bold py-2 px-4 rounded transition duration-300"
            >
              {t("book_session")}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
