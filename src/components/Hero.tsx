"use client";
import { Dancing_Script, Aref_Ruqaa } from "next/font/google";
import { useScroll } from "@/contexts/ScrollContext";
import React from "react";
import { useTheme } from "next-themes";

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

export default function Hero() {
  const { scrollY } = useScroll();
    const { theme } = useTheme();

  const gradient = React.useMemo(() => {
      if(theme === "dark"){
          return "linear-gradient(to bottom, rgba(255,255,255,0.1) 75%, rgba(25,24,29,1) 98%)";
      } else{
          return "linear-gradient(to bottom, rgba(200,200,200,0.1) 82%, rgba(255,255,255,1) 98%)";
      }
  }, [theme]);
  const randomImage = React.useMemo(() => {
    const images = [
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
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      />
      <div className="relative z-10 text-center">
        <h1
          className={`${dancingScript.className} text-5xl md:text-7xl font-bold mb-4 text-peach-fuzz-600 dark:text-white text-shadow-default shadow-neutral-800 dark:shadow-peach-fuzz-800`}
        >
          Sensuelle Boudoir
        </h1>
        <p
          className={`${arefRuqaa.className} text-2xl md:text-3xl text-peach-fuzz-600 dark:text-neutral-200 text-shadow-sm shadow-neutral-800 dark:shadow-peach-fuzz-800`}
        >
          Capture Your Essence
        </p>
      </div>
    </section>
  );
}
