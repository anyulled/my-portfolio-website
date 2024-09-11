"use client";
import { Dancing_Script, Aref_Ruqaa } from "next/font/google";
import { useScroll } from "@/contexts/ScrollContext";

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

export default function Hero() {
  const { scrollY } = useScroll();

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "url('https://live.staticflickr.com/65535/53367295647_2ff0fdf881_h.jpg')",
          backgroundAttachment: "fixed",
          backgroundPosition: "center",
          backgroundSize: "cover",
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      />
      <div className="relative z-10 text-center">
        <h1
          className={`${dancingScript.className} text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl text-yellow-600 dark:text-white`}
        >
          Sensuelle Boudoir
        </h1>
        <p
          className={`${arefRuqaa.className} text-2xl md:text-3xl dark:text-neutral-400 text-yellow-700 drop-shadow-lg`}
        >
          Capture Your Essence
        </p>
      </div>
    </section>
  );
}
