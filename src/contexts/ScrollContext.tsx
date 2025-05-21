"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import {gsap} from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import Lenis from "lenis";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type ScrollContextType = {
  scrollY: number;
  lenis: Lenis | null;
};

const ScrollContext = createContext<ScrollContextType>({
  scrollY: 0,
  lenis: null
});

export const useScroll = () => useContext(ScrollContext);

export const ScrollProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [scrollY, setScrollY] = useState(0);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      touchMultiplier: 2,
      smoothWheel: true
    });

    lenisRef.current = lenis;
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    lenis.on("scroll", ({ scroll }: { scroll: number }) => {
      setScrollY(scroll);
    });
    return () => {
      gsap.ticker.remove(lenis.raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <ScrollContext.Provider value={{ scrollY, lenis: lenisRef.current }}>
      {children}
    </ScrollContext.Provider>
  );
};
