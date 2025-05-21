"use client";
import {Aref_Ruqaa, Dancing_Script} from "next/font/google";
import React, {useEffect, useRef, useState} from "react";
import {useTranslations} from "next-intl";
import {useGSAP} from "@gsap/react";
import gsap from "gsap";

if (typeof window !== 'undefined') {
    gsap.registerPlugin(useGSAP);
}

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });
const images = [
  {
    image: "https://live.staticflickr.com/65535/54349881217_a687110589_k_d.jpg",
    position: "left top",
  },
  {
    image: "https://live.staticflickr.com/65535/53564630658_b2aeab68f2_h.jpg",
    position: "37% top",
  },
  {
    image: "https://live.staticflickr.com/65535/53367295647_2ff0fdf881_h.jpg",
    position: "25% top",
  },
  {
    image: "https://live.staticflickr.com/65535/53923428207_dc41871f93_h.jpg",
    position: "25% top",
  },
  {
    image: "https://live.staticflickr.com/65535/53564630648_06aa8a167d_h.jpg",
    position: "37% top",
  },
  {
    image: "https://live.staticflickr.com/65535/53963952034_7372534fc0_h.jpg",
    position: "75% top",
  },
];

export default function Hero() {
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
    return images[Math.floor(Math.random() * images.length)];
  }, []);

    useGSAP(() => {
        if (mounted) {
            if (backgroundRef.current) {
                gsap.fromTo(backgroundRef.current,
                    {opacity: 0, scale: 1.1},
                    {
                        opacity: 1,
                        scale: 1,
                        duration: 1.5,
                        ease: "power2.out"
                    }
                );
            }

            if (titleRef.current) {
                gsap.fromTo(titleRef.current,
                    {opacity: 0, y: -50},
                    {
                        opacity: 1,
                        y: 0,
                        duration: 1.5,
                        delay: 0.5,
                        ease: "back.out(1.7)"
                    }
                );
            }

            if (subtitleRef.current) {
                gsap.fromTo(subtitleRef.current,
                    {opacity: 0, y: 30},
                    {
                        opacity: 1,
                        y: 0,
                        duration: 1.5,
                        delay: 1,
                        ease: "power3.out"
                    }
                );
            }

            if (containerRef.current) {
                gsap.fromTo(containerRef.current,
                    {autoAlpha: 0},
                    {
                        autoAlpha: 1,
                        duration: 0.5
                    }
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
          className="relative h-screen flex items-center justify-center overflow-hidden bg-mocha-mousse-50 dark:bg-mocha-mousse-900 text-mocha-mousse-900 dark:text-mocha-mousse-50"
      >
      <div
          ref={backgroundRef}
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('${randomImage.image}')`,
          backgroundAttachment: "fixed",
          backgroundPosition: randomImage.position,
          backgroundSize: "cover",
          mask: "linear-gradient(to bottom, white 66%, transparent 95%)",
            opacity: 0, // Initial state for animation
        }}
      />
      <div className="relative z-10 text-center">
        <h1
            ref={titleRef}
          className={`${dancingScript.className} text-5xl md:text-7xl font-bold mb-4 text-mocha-mousse-900 shadow-mocha-mousse-100 dark:shadow-mocha-mousse-200 dark:text-white text-shadow-default`}
            style={{opacity: 0}} // Initial state for animation
        >
          Sensuelle Boudoir
        </h1>
        <p
            ref={subtitleRef}
          className={`${arefRuqaa.className} text-2xl md:text-3xl text-neutral-300 shadow-mocha-mousse-800 dark:text-neutral-200 dark:shadow-mocha-mousse-300 text-shadow-sm`}
            style={{opacity: 0}} // Initial state for animation
        >
          {t("capture_your_essence")}
        </p>
      </div>
    </section>
  );
}
