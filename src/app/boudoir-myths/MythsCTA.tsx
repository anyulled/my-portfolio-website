"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Camera, MessageCircle } from "lucide-react";
import { Aref_Ruqaa } from "next/font/google";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

export default function MythsCTA() {
  const ctaRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("myths.cta");

  useEffect(() => {
    const cta = ctaRef.current;
    const content = contentRef.current;
    const actions = actionsRef.current;

    if (!cta || !content || !actions) return;

    // Initial states
    gsap.set([content, actions], {
      opacity: 0,
      y: 50
    });

    // Animation on scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: cta,
        start: "top 70%",
        end: "bottom 30%",
        toggleActions: "play none none reverse"
      }
    });

    tl.to(content, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out"
    }).to(
      actions,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      },
      "-=0.4"
    );

    // Floating animation for action cards
    gsap.to(actions.querySelectorAll(".action-card"), {
      y: -5,
      duration: 2.5,
      ease: "power2.inOut",
      stagger: 0.3,
      repeat: -1,
      yoyo: true
    });
  }, []);

  return (
      <section ref={ctaRef} className="py-20 bg-cream-tan-200">
      <div className="max-w-6xl mx-auto px-4">
        <div ref={contentRef} className="text-center mb-16">
          <h2
              className={`${arefRuqaa.className} text-3xl md:text-5xl font-serif dark:text-chocolate-martini-800 text-chocolate-martini-800 mb-6`}
          >
            {t("heading")}
          </h2>
            <p className="text-xl dark:text-chanterelle-400 text-chanterelle-400 max-w-4xl mx-auto mb-8">
              {t("paragraph")}
          </p>
          <Button
            size="lg"
            className="bg-chocolate-martini-default hover:bg-chanterelle-default text-white px-8 py-6 text-lg rounded-full transition-all duration-300 transform hover:scale-105"
          >
            <Calendar className="mr-2 h-5 w-5" />
            {t("book_button")}
          </Button>
        </div>

        <div
          ref={actionsRef}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div
            className="action-card bg-white p-6 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
            <MessageCircle
              className="h-12 w-12 text-chanterelle-default mx-auto mb-4" />
            <h3
              className="text-lg font-semibold text-chocolate-martini-default mb-2">
              {t("cards.0.title")}
            </h3>
            <p className="text-chanterelle-700 text-sm">
              {t("cards.0.text")}
            </p>
          </div>

          <div
            className="action-card bg-white p-6 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
            <BookOpen className="h-12 w-12 text-chanterelle- mx-auto mb-4" />
            <h3
              className="text-lg font-semibold text-chocolate-martini-default mb-2">
              {t("cards.1.title")}
            </h3>
            <p className="text-chanterelle-700 text-sm">
              {t("cards.1.text")}
            </p>
          </div>

          <div
            className="action-card bg-white p-6 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
            <Camera
              className="h-12 w-12 text-chanterelle-default mx-auto mb-4" />
            <h3
              className="text-lg font-semibold text-chocolate-martini-default mb-2">
              {t("cards.2.title")}
            </h3>
            <p className="text-chanterelle-700 text-sm">
              {t("cards.2.text")}
            </p>
          </div>

          <div
            className="action-card bg-white p-6 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
            <div
              className="h-12 w-12 bg-chanterelle-default rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">★</span>
            </div>
            <h3
              className="text-lg font-semibold text-chocolate-martini-default mb-2">
              {t("cards.3.title")}
            </h3>
            <p className="text-chanterelle-700 text-sm">
              {t("cards.3.text")}
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-chanterelle-600 text-sm">
            {t("footer")}
          </p>
        </div>
      </div>
    </section>
  );
}
