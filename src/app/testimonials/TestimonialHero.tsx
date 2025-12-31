"use client";

import Image from "next/image";

import { useTranslations } from "next-intl";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

interface TestimonialsHeroProps {
  image: string;
}

export default function TestimonialsHero({
  image,
}: Readonly<TestimonialsHeroProps>) {
  const t = useTranslations("testimonials");

  return (
    <section className="relative h-[50vh] min-h-[500px] w-full overflow-hidden">
      <div className="absolute inset-0 bg-background/80 dark:bg-background/90">
        <Image
          src={image}
          alt={"boudoir"}
          width={1920}
          height={800}
          className={"object-cover h-full opacity-60 block mx-auto w-full"}
        />
      </div>
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 pt-36">
        <h1
          className={`${dancingScript.className} text-4xl md:text-6xl font-serif text-foreground dark:text-foreground mb-4`}
        >
          {t("client_testimonials")}
        </h1>
        <p
          className={`${arefRuqaa.className} text-xl md:text-2xl text-muted-foreground dark:text-muted-foreground font-light max-w-3xl`}
        >
          {t("real_stories")}
        </p>
      </div>
    </section>
  );
}
