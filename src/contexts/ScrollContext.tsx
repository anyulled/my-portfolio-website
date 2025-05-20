"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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

  // Initialize Lenis for smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      touchMultiplier: 2,
      smoothWheel: true
    });

    // Store lenis instance in ref
    lenisRef.current = lenis;

    // Connect GSAP's ticker to Lenis
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    // Update scrollY for compatibility with existing code
    lenis.on("scroll", ({ scroll }: { scroll: number }) => {
      setScrollY(scroll);
    });

    // Cleanup
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
