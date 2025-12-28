"use client";
import Image from "next/image";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import { Card, CardContent } from "@/components/ui/card";
import Gallery from "@/components/Gallery";
import Link from "next/link";
import { Suspense, useRef } from "react";
import Loading from "@/app/loading";
import { Photo } from "@/types/photos";
import { useTranslations } from "next-intl";
import FadeInTitle from "@/components/FadeInTitle";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScroll } from "@/contexts/ScrollContext";
import { useFadeIn } from "@/hooks/useFadeIn";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

//region Fonts
const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });
//endregion

/* eslint-disable  @typescript-eslint/no-non-null-asserted-optional-chain */

export default function BoudoirContent({
  randomPhotos,
}: Readonly<{
  randomPhotos: Photo[];
}>) {
  const t = useTranslations("what_is_boudoir");
  const textRef1 = useFadeIn({ x: -50, y: 0, start: "top 80%" });
  const textRef2 = useFadeIn({ x: 50, y: 0, start: "top 80%" });
  const imageRef1 = useFadeIn({
    scale: 0.8,
    y: 0,
    duration: 1,
    start: "top 80%",
  });
  const imageRef2 = useFadeIn({
    scale: 0.8,
    y: 0,
    duration: 1,
    start: "top 80%",
  });
  const listRef = useRef<HTMLUListElement>(null);
  const ctaRef = useFadeIn({ y: 30, delay: 0.5, start: "top 90%" });
  const { lenis } = useScroll();

  useGSAP(
    () => {
      if (listRef.current) {
        const listItems = listRef.current.querySelectorAll("li");
        gsap.from(listItems, {
          opacity: 0,
          y: 20,
          stagger: 0.2,
          duration: 0.5,
          scrollTrigger: {
            trigger: listRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
            scroller: document.documentElement,
          },
        });
      }
    },
    { dependencies: [lenis] },
  );

  return (
    <>
      <header className="container mx-auto px-4 pt-24 pb-4 text-center">
        <FadeInTitle>
          <h1
            className={`${dancingScript.className} text-5xl md:text-7xl mb-4 text-foreground dark:text-foreground`}
          >
            {t("boudoir_photography")}
          </h1>
        </FadeInTitle>
        <FadeInTitle delay={0.3}>
          <h2
            className={`${arefRuqaa.className} text-xl md:text-2xl text-muted-foreground dark:text-muted-foreground`}
          >
            {t("empowering")}
          </h2>
        </FadeInTitle>
      </header>
      <main className="container mx-auto px-4 py-4">
        <section className="mb-16">
          <FadeInTitle>
            <h2
              className={`${arefRuqaa.className} text-3xl md:text-4xl mb-6 text-muted-foreground dark:text-muted-foreground`}
            >
              {t("what_is_boudoir")}
            </h2>
          </FadeInTitle>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div ref={textRef1} className="md:w-2/3">
              <p className="mb-4 prose lg:prose-xl text-foreground dark:text-foreground">
                {t("p1")}
              </p>
              <p
                className={
                  "prose lg:prose-xl text-foreground dark:text-foreground"
                }
              >
                {t("p2")}
              </p>
            </div>
            <div ref={imageRef1} className="md:w-1/3">
              <Image
                priority
                src={randomPhotos?.at(1)?.urlZoom!}
                blurDataURL={randomPhotos?.at(1)?.urlCrop}
                placeholder="blur"
                alt={t("boudoir_photography")}
                width={600}
                height={400}
                className="rounded-lg shadow-lg h-auto w-full hover:scale-105 hover:shadow-xl transition-all duration-500 ease-in-out"
              />
            </div>
          </div>
        </section>
        <section className="mb-16">
          <FadeInTitle>
            <h2
              className={`${arefRuqaa.className} text-3xl md:text-4xl mb-6 text-muted-foreground dark:text-muted-foreground`}
            >
              {t("art_boudoir")}
            </h2>
          </FadeInTitle>
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div ref={textRef2} className="md:w-2/3">
              <p className="mb-4 prose lg:prose-xl text-foreground dark:text-foreground">
                {t("p3")}
              </p>
              <p
                className={
                  "prose lg:prose-xl text-foreground dark:text-foreground"
                }
              >
                {t("p4")}
              </p>
            </div>
            <div ref={imageRef2} className="md:w-1/3">
              <Image
                priority
                src={randomPhotos?.at(2)?.urlZoom!}
                blurDataURL={randomPhotos?.at(2)?.urlCrop}
                placeholder="blur"
                alt={t("boudoir_photography")}
                width={600}
                height={400}
                className="rounded-lg shadow-lg h-auto w-full hover:scale-105 hover:shadow-xl transition-all duration-500 ease-in-out"
              />
            </div>
          </div>
        </section>
        <section className="mb-16">
          <FadeInTitle>
            <h2
              className={`${arefRuqaa.className} text-3xl md:text-4xl mb-6 text-muted-foreground dark:text-muted-foreground`}
            >
              {t("why_boudoir")}
            </h2>
          </FadeInTitle>
          <ul
            ref={listRef}
            className="list-disc list-inside mb-8 ml-4 text-foreground dark:text-foreground"
          >
            <li>{t("l1")}.</li>
            <li>{t("l2")}.</li>
            <li>{t("l3")}.</li>
            <li>{t("l4")}.</li>
            <li>{t("l5")}.</li>
          </ul>
          <Card
            className={
              "bg-card dark:bg-card transform transition-all duration-500 hover:shadow-xl"
            }
          >
            <CardContent>
              <Suspense fallback={<Loading />}>
                <Gallery photos={randomPhotos} showTitle={false} />
              </Suspense>
            </CardContent>
          </Card>
        </section>
        <section>
          <FadeInTitle>
            <h2
              className={`${arefRuqaa.className} text-3xl md:text-4xl mb-6 text-muted-foreground dark:text-muted-foreground`}
            >
              {t("boudoir_experience")}
            </h2>
          </FadeInTitle>
          <p className="mb-4 prose lg:prose-xl text-foreground dark:text-foreground">
            {t("p5")}
          </p>
          <p className="mb-8 prose lg:prose-xl text-foreground dark:text-foreground">
            {t("p6")}
          </p>
          <div ref={ctaRef} className="text-center pb-5">
            <Link
              href="/#book-session"
              className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground dark:text-primary-foreground font-bold py-2 px-4 rounded transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
            >
              {t("book_session")}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
