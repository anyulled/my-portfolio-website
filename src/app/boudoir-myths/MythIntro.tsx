"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Heart, Lightbulb, Users } from "lucide-react";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

export default function MythsIntro() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("myths.intro");

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const stats = statsRef.current;

    if (!section || !content || !stats) return;

    gsap.set([content, stats], {
      opacity: 0,
      y: 50,
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 30%",
        end: "bottom 30%",
        toggleActions: "play none none reverse",
      },
    });

    tl.to(content, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
    }).to(
      stats,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
      },
      "-=0.4",
    );
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div ref={contentRef} className="text-center mb-16">
          <div className="w-16 h-16 bg-mocha-mousse-300/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lightbulb className="h-8 w-8 text-mocha-mousse-500" />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif text-mocha-mousse-900 mb-6">
            {t("title")}
          </h2>
          <p className="text-xl text-mocha-mousse-700 max-w-4xl mx-auto leading-relaxed">
            {t("paragraph")}
          </p>
        </div>

        <div ref={statsRef} className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-mocha-mousse-100 rounded-2xl">
            <Users className="h-12 w-12 text-mocha-mousse-800 mx-auto mb-4" />
            <div className="text-3xl font-bold text-mocha-mousse-900 mb-2">
              {t("stats.0.value")}
            </div>
            <p className="text-mocha-mousse-700">{t("stats.0.text")}</p>
          </div>
          <div className="text-center p-6 bg-mocha-mousse-100 rounded-2xl">
            <Heart className="h-12 w-12 text-mocha-mousse-900 mx-auto mb-4" />
            <div className="text-3xl font-bold text-mocha-mousse-900 mb-2">
              {t("stats.1.value")}
            </div>
            <p className="text-mocha-mousse-700">{t("stats.1.text")}</p>
          </div>
          <div className="text-center p-6 bg-mocha-mousse-100 rounded-2xl">
            <div className="text-3xl font-bold text-mocha-mousse-800 mx-auto mb-4">
              {t("stats.2.stars")}
            </div>
            <div className="text-3xl font-bold text-mocha-mousse-900 mb-2">
              {t("stats.2.value")}
            </div>
            <p className="text-mocha-mousse-700">{t("stats.2.text")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
