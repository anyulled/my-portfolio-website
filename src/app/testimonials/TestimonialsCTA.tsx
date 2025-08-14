"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Camera, Heart } from "lucide-react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Aref_Ruqaa } from "next/font/google";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import useAnalyticsEventTracker from "@/hooks/eventTracker";

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

gsap.registerPlugin(ScrollTrigger);

export default function TestimonialsCTA() {
  const gaEventTracker = useAnalyticsEventTracker("testimonials");
  const ctaRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("testimonials");

  useEffect(() => {
    const cta = ctaRef.current;
    const content = contentRef.current;
    const icons = iconsRef.current;

    if (!cta || !content || !icons) return;

    // Initial states
    gsap.set([content, icons], {
      opacity: 0,
      y: 50
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: cta,
        start: "top 70%",
        end: "bottom 30%",
        toggleActions: "play none none reverse"
      },
    });

    tl.to(content, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out"
    }).to(
      icons,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      },
      "-=0.4"
    );

    gsap.to(icons.children, {
      y: -10,
      duration: 2,
      ease: "power2.inOut",
      stagger: 0.2,
      repeat: -1,
      yoyo: true
    });
  }, []);
  const router = useRouter();

  function handleClick() {
    router.push("/#book-session");
    gaEventTracker("form_submit", "success");
  }

  return (
    <section
      ref={ctaRef}
      className="bg-gradient-to-r from-mocha-mousse-800 to-mocha-mousse-900 py-20"
    >
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div ref={contentRef}>
          <h2
            className={`${arefRuqaa.className} text-3xl md:text-4xl font-serif text-white mb-6`}
          >
            {t("ready_to_create")}
          </h2>
          <p className="text-mocha-mousse-100 text-lg mb-8 max-w-2xl mx-auto">
            {t("join_hundreds")}
          </p>
          <Button
            onClick={handleClick}
            size="lg"
            className="bg-white text-mocha-mousse-200 hover:bg-mocha-mousse-100 px-8 py-6 text-lg rounded-full transition-all duration-300 transform hover:scale-105"
          >
            <Calendar className="mr-2 h-5 w-5" />
            {t("book_your_session")}
          </Button>
        </div>

        <div
          ref={iconsRef}
          className="flex justify-center items-center space-x-12 mt-12"
        >
          <div className="text-center">
            <Heart className="h-12 w-12 text-white mx-auto mb-2" />
            <p className="text-mocha-mousse-100 text-sm">{t("empowering")}</p>
          </div>
          <div className="text-center">
            <Camera className="h-12 w-12 text-white mx-auto mb-2" />
            <p className="text-mocha-mousse-100 text-sm">{t("professional")}</p>
          </div>
          <div className="text-center">
            <div
              className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-mocha-mousse-100 font-bold text-xl">★</span>
            </div>
            <p className="text-mocha-mousse-100 text-sm">{t("five-star")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
