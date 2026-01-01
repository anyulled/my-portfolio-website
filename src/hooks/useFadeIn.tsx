"use client";
import { useScroll } from "@/contexts/ScrollContext";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useRef } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface UseFadeInOptions {
  delay?: number;
  duration?: number;
  threshold?: number;
  stagger?: number;
  index?: number;
  ease?: string;
  x?: number;
  y?: number;
  scale?: number;
  start?: string;
  toggleActions?: string;
}

const setupScrollTrigger = (lenis: Lenis) => {
  ScrollTrigger.scrollerProxy(document.documentElement, {
    scrollTop(value) {
      if (arguments.length) {
        lenis.scrollTo(value ?? 0);
      }
      return lenis.scroll;
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

  lenis.on("scroll", ScrollTrigger.update);
};

const DEFAULT_OPTIONS: UseFadeInOptions = {
  delay: 0.2,
  duration: 0.8,
  threshold: 0.3,
  stagger: 0.1,
  index: 0,
  ease: "power2.out",
  x: 0,
  y: 20,
  scale: 1,
  toggleActions: "play none none none",
};

export function useFadeIn(options: UseFadeInOptions = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const {
    delay,
    duration,
    threshold,
    stagger,
    index,
    ease,
    x,
    y,
    scale,
    toggleActions,
  } = mergedOptions;
  const start =
    mergedOptions.start ?? `top bottom-=${(threshold ?? 0.3) * 100}%`;

  const elementRef = useRef<HTMLDivElement>(null);
  const { lenis } = useScroll();

  useEffect(() => {
    if (lenis) {
      setupScrollTrigger(lenis);
    }

    return () => {
      if (lenis) {
        lenis.off("scroll", ScrollTrigger.update);
      }
    };
  }, [lenis]);

  useGSAP(
    () => {
      const element = elementRef.current;

      if (element) {
        gsap.set(element, {
          opacity: 0,
          y,
          x,
          scale,
        });

        gsap.to(element, {
          opacity: 1,
          duration: duration ?? 0.8,
          delay: (delay ?? 0.2) + (index ?? 0) * (stagger ?? 0.1),
          ease: ease ?? "power2.out",
          y: 0,
          x: 0,
          scale: 1,
          scrollTrigger: {
            trigger: element,
            start,
            toggleActions: toggleActions ?? "play none none none",
            scroller: document.documentElement,
          },
        });
      }
    },
    { scope: elementRef, dependencies: [lenis, index] },
  );

  return elementRef;
}
