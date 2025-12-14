"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { Check, X } from "lucide-react";
import { Photo } from "@/types/photos";
import { useTranslations } from "next-intl";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";

gsap.registerPlugin(ScrollTrigger);

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

interface MythsHeroProps {
  heroImage: Photo;
}

export default function MythsHero({ heroImage }: Readonly<MythsHeroProps>) {
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const iconsRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("myths.hero");

  useEffect(() => {
    const hero = heroRef.current;
    const title = titleRef.current;
    const subtitle = subtitleRef.current;
    const icons = iconsRef.current;

    if (!hero || !title || !subtitle || !icons) return;

    gsap.set([title, subtitle, icons], {
      opacity: 0,
      y: 50,
    });

    const tl = gsap.timeline({ delay: 0.5 });

    tl.to(title, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: "power2.out",
    })
      .to(
        subtitle,
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
        },
        "-=0.8",
      )
      .to(
        icons,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.4",
      );

    gsap.to(hero, {
      yPercent: -30,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    gsap.to(icons.children, {
      y: -10,
      duration: 3,
      ease: "power2.inOut",
      stagger: 0.5,
      repeat: -1,
      yoyo: true,
    });
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative h-[70vh] min-h-[600px] w-full overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-mocha-mousse-900/80 to-mocha-mousse-800/70">
        <Image
          src={heroImage.urlLarge}
          alt={t("alt")}
          width={1920}
          height={1080}
          className="object-cover w-full h-full opacity-60"
          priority
        />
      </div>

      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto mt-28">
        <h1
          ref={titleRef}
          className={`${dancingScript.className} text-4xl md:text-6xl font-serif text-white mb-6 leading-tight`}
        >
          {t("title1")}
          <span className="block text-cream-tan-100 text-shadow-lg">
            {t("title2")}
          </span>
        </h1>

        <p
          ref={subtitleRef}
          className={`${arefRuqaa.className} text-xl md:text-2xl text-cream-tan-100 font-light max-w-4xl mb-12`}
        >
          {t("subtitle")}
        </p>

        <div
          ref={iconsRef}
          className="flex justify-center items-center space-x-12"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <X className="h-8 w-8 text-red-300" />
            </div>
            <p className="text-pantone-creamTan200 text-sm">
              {t("label_myths")}
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="h-8 w-8 text-green-300" />
            </div>
            <p className="text-pantone-creamTan200 text-sm">
              {t("label_truth")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
