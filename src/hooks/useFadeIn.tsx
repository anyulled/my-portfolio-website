"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

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
    { scope: elementRef, dependencies: [index] },
  );

  return elementRef;
}
