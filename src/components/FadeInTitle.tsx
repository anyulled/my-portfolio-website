"use client";
import React, { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScroll } from "@/contexts/ScrollContext";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface FadeInTitleProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
}

export default function FadeInTitle({
                                      children,
                                      delay = 0.2,
                                      duration = 0.8,
                                      className = "",
                                      threshold = 0.3
                                    }: Readonly<FadeInTitleProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { lenis } = useScroll();

  useEffect(() => {
    if (lenis) {
      ScrollTrigger.scrollerProxy(document.documentElement, {
        scrollTop(value) {
          if (arguments.length) {
            lenis.scrollTo(value);
          }
          return lenis.scroll;
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight
          };
        }
      });

      lenis.on("scroll", ScrollTrigger.update);
    }

    return () => {
      if (lenis) {
        lenis.off("scroll", ScrollTrigger.update);
      }
    };
  }, [lenis]);

  useGSAP(() => {
    const element = containerRef.current;

    if (element) {
      gsap.set(element, { opacity: 0, y: 20 });

      gsap.to(element, {
        opacity: 1,
        y: 0,
        duration: duration,
        delay: delay,
        ease: "power2.out",
        scrollTrigger: {
          trigger: element,
          start: `top bottom-=${threshold * 100}%`,
          toggleActions: "play none none none",
          scroller: document.documentElement
        }
      });
    }
  }, { scope: containerRef, dependencies: [lenis] });

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
