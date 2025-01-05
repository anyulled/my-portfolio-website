"use client";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import React from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

export default function Hero() {
  const { theme } = useTheme();
  const t = useTranslations("home");

  const gradient = React.useMemo(() => {
    if (theme === "dark") {
      return "linear-gradient(to bottom, rgba(255,255,255,0.1) 75%, rgba(25,24,29,1) 98%)";
    } else {
      return "linear-gradient(to bottom, rgba(200,200,200,0.1) 82%, rgba(255,255,255,1) 98%)";
    }
  }, [theme]);
  const randomImage = React.useMemo(() => {
    const images = [
      "https://live.staticflickr.com/65535/54349881217_a687110589_k_d.jpg",
      "https://live.staticflickr.com/65535/53564630658_b2aeab68f2_h.jpg",
      "https://live.staticflickr.com/65535/53367295647_2ff0fdf881_h.jpg",
      "https://live.staticflickr.com/65535/53923428207_dc41871f93_h.jpg",
      "https://live.staticflickr.com/65535/53564630648_06aa8a167d_h.jpg",
      "https://live.staticflickr.com/65535/53963952034_7372534fc0_h.jpg",
    ];
    return images[Math.floor(Math.random() * images.length)];
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute"
        style={{
          display: "none",
          background: gradient,
          zIndex: 9,
          width: "100%",
          height: "100%",
        }}
      >
        &nbsp;
      </div>
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('${randomImage}')`,
          backgroundAttachment: "fixed",
          backgroundPosition: "center",
          backgroundSize: "cover",
          mask: "linear-gradient(to bottom, black 75%, transparent 90%)",
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
