"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useTranslations } from "next-intl";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import React, { useEffect, useRef, useState } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });
interface HeroProps {
  images: {
    image: string;
    position: string;
  }[];
}

export default function Hero({ images }: Readonly<HeroProps>) {
  const t = useTranslations("home");
  const [mounted, setMounted] = useState(false);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const randomImage = React.useMemo(() => {
    if (!images || images.length === 0) return null;
    return images[Math.floor(Math.random() * images.length)];
  }, [images]);

  useGSAP(() => {
    if (mounted) {
      if (backgroundRef.current) {
        gsap.fromTo(
          backgroundRef.current,
          { opacity: 0, scale: 1.1 },
          {
            opacity: 1,
            scale: 1,
            duration: 1.5,
            ease: "power2.out",
          },
        );
      }

      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { opacity: 0, y: -50 },
          {
            opacity: 1,
            y: 0,
            duration: 1.5,
            delay: 0.5,
            ease: "back.out(1.7)",
          },
        );
      }

      if (subtitleRef.current) {
        gsap.fromTo(
          subtitleRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1.5,
            delay: 1,
            ease: "power3.out",
          },
        );
      }

      if (containerRef.current) {
        gsap.fromTo(
          containerRef.current,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 0.5,
          },
        );
      }
    }
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <section
      ref={containerRef}
      className="relative h-screen flex items-center justify-center overflow-hidden bg-background dark:bg-background text-foreground dark:text-foreground"
    >
      {randomImage && (
        <div
          ref={backgroundRef}
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('${randomImage.image}')`,
            backgroundAttachment: "fixed",
            backgroundPosition: randomImage.position,
            backgroundSize: "cover",
            mask: "linear-gradient(to bottom, white 66%, transparent 95%)",
            // Initial state for animation
            opacity: 0,
          }}
        />
      )}
      <div className="relative z-10 text-center">
        <h1
          ref={titleRef}
          className={`${dancingScript.className} text-5xl md:text-7xl font-bold mb-4 text-foreground shadow-background dark:shadow-muted dark:text-white text-shadow-default`}
          style={{ opacity: 0 }}
        >
          Sensuelle Boudoir
        </h1>
        <p
          ref={subtitleRef}
          className={`${arefRuqaa.className} text-2xl md:text-3xl text-neutral-300 shadow-foreground dark:text-neutral-200 dark:shadow-muted-foreground text-shadow-sm`}
          style={{ opacity: 0 }}
        >
          {t("capture_your_essence")}
        </p>
      </div>
    </section>
  );
}
