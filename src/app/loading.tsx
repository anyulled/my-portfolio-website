"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import { Dancing_Script } from "next/font/google";
import { useEffect, useState } from "react";

const dancingScript = Dancing_Script({ subsets: ["latin"] });

export default function Loading() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center justify-center h-screen w-full">
      <LazyMotion features={domAnimation} strict>
        <m.h1
          className={`text-4xl md:text-6xl lg:text-8xl ${dancingScript.className} text-transparent bg-clip-text`}
          style={{
            backgroundImage:
              "linear-gradient(90deg, #fbbf24, #f59e0b, #d97706, #f59e0b, #fbbf24)",
            backgroundSize: "200% 100%",
          }}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 3,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          Sensuelle Boudoir
        </m.h1>
      </LazyMotion>
    </div>
  );
}
