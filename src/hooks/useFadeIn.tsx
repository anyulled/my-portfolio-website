"use client";
import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap, { AnimationVars } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScroll } from "@/contexts/ScrollContext";

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

export function useFadeIn(options: UseFadeInOptions = {}) {
    const {
        delay = 0.2,
        duration = 0.8,
        threshold = 0.3,
        stagger = 0.1,
        index = 0,
        ease = "power2.out",
        x = 0,
        y = 20,
        scale = 1,
        start = `top bottom-=${threshold * 100}%`,
        toggleActions = "play none none none"
    } = options;

    const elementRef = useRef<HTMLDivElement>(null);
    const {lenis} = useScroll();

    useEffect(() => {
        if (lenis) {
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
        const element = elementRef.current;

        if (element) {
          const initialProps: {
            y: number;
            x: number;
            scale: number;
            opacity: number
          } = {
            opacity: 0,
            y: 0,
            x: 0,
            scale: 1
          };
            if (y !== 0) initialProps.y = y;
            if (x !== 0) initialProps.x = x;
            if (scale !== 1) initialProps.scale = scale;

            gsap.set(element, initialProps);

          const animationProps: AnimationVars = {
                opacity: 1,
                duration: duration,
                delay: delay + (index * stagger),
                ease: ease,
                scrollTrigger: {
                    trigger: element,
                    start: start,
                    toggleActions: toggleActions,
                    scroller: document.documentElement
                }
            };

            if (y !== 0) animationProps.y = 0;
            if (x !== 0) animationProps.x = 0;
            if (scale !== 1) animationProps.scale = 1;

            gsap.to(element, animationProps);
        }
    }, {scope: elementRef, dependencies: [lenis, index]});

    return elementRef;
}