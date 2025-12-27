"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

import { gsap } from "gsap";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import { useTranslations } from "next-intl";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

interface TestimonialsHeroProps {
  image: string;
}

export default function TestimonialsHero({ image }: TestimonialsHeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const t = useTranslations("testimonials");

  useEffect(() => {
    const hero = heroRef.current;
    const title = titleRef.current;
    const subtitle = subtitleRef.current;

    if (!hero || !title || !subtitle) return;

    gsap.set([title, subtitle], {
      opacity: 0,
      y: 30,
    });

    const tl = gsap.timeline();

    tl.to(title, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power2.out",
    }).to(
      subtitle,
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
      },
      "-=0.5",
    );

    gsap.to(hero, {
      yPercent: -50,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative h-[50vh] min-h-[500px] w-full overflow-hidden"
    >
      <div className="absolute inset-0 bg-mocha-mousse-300/80">
        <Image
          src={
            image
          }
          alt={"boudoir"}
          width={1920}
          height={800}
          className={"object-cover h-full opacity-60"}
        />
      </div>
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 pt-36">
        <h1
          ref={titleRef}
          className={`${dancingScript.className} text-4xl md:text-6xl font-serif text-mocha-mousse-900 shadow-mocha-mousse-100 dark:shadow-mocha-mousse-200 dark:text-white text-shadow-default mb-4`}
        >
          {t("client_testimonials")}
        </h1>
        <p
          ref={subtitleRef}
          className={`${arefRuqaa.className} text-xl md:text-2xl text-neutral-300 shadow-mocha-mousse-800 dark:text-neutral-200 dark:shadow-mocha-mousse-300 text-shadow-sm font-light max-w-3xl`}
        >
          {t("real_stories")}
        </p>
      </div>
    </section>
  );
}
