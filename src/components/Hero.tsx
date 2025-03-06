"use client";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

export default function Hero() {
  const t = useTranslations("home");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const randomImage = React.useMemo(() => {
    const images = [
      {
        image:
          "https://live.staticflickr.com/65535/54349881217_a687110589_k_d.jpg",
        position: "left top",
      },
      {
        image:
          "https://live.staticflickr.com/65535/53564630658_b2aeab68f2_h.jpg",
        position: "left top",
      },
      {
        image:
          "https://live.staticflickr.com/65535/53367295647_2ff0fdf881_h.jpg",
        position: "left top",
      },
      {
        image:
          "https://live.staticflickr.com/65535/53923428207_dc41871f93_h.jpg",
        position: "left top",
      },
      {
        image:
          "https://live.staticflickr.com/65535/53564630648_06aa8a167d_h.jpg",
        position: "center top",
      },
      {
        image:
          "https://live.staticflickr.com/65535/53963952034_7372534fc0_h.jpg",
        position: "right top",
      },
    ];
    return images[Math.floor(Math.random() * images.length)];
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-mocha-mousse-50 dark:bg-mocha-mousse-900 text-mocha-mousse-900 dark:text-mocha-mousse-50">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('${randomImage.image}')`,
          backgroundAttachment: "fixed",
          backgroundPosition: randomImage.position,
          backgroundSize: "cover",
          mask: "linear-gradient(to bottom, white 66%, transparent 95%)",
        }}
      />
      <div className="relative z-10 text-center">
        <h1
          className={`${dancingScript.className} text-5xl md:text-7xl font-bold mb-4 text-mocha-mousse-900 shadow-mocha-mousse-100 dark:shadow-mocha-mousse-200 dark:text-white text-shadow-default`}
        >
          Sensuelle Boudoir
        </h1>
        <p
          className={`${arefRuqaa.className} text-2xl md:text-3xl text-neutral-300 shadow-mocha-mousse-800 dark:text-neutral-200 dark:shadow-mocha-mousse-300 text-shadow-sm`}
        >
          {t("capture_your_essence")}
        </p>
      </div>
    </section>
  );
}
