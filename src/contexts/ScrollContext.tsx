"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type ScrollContextType = {
  lenis: Lenis | null;
};

const ScrollContext = createContext<ScrollContextType>({
  lenis: null,
});

export const useScroll = () => useContext(ScrollContext);

export const ScrollProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const newLenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      touchMultiplier: 2,
      smoothWheel: true,
    });

    setLenis(newLenis);

    const update = (time: number) => {
      newLenis.raf(time * 1000);
    };

    gsap.ticker.add(update);

    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value) {
        if (arguments.length) {
          newLenis.scrollTo(value ?? 0);
        }
        return newLenis.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
    });

    const onScroll = ScrollTrigger.update;
    newLenis.on("scroll", onScroll);
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(update);
      newLenis.off("scroll", onScroll);
      newLenis.destroy();
    };
  }, []);

  return (
    <ScrollContext.Provider value={{ lenis }}>
      {children}
    </ScrollContext.Provider>
  );
};
