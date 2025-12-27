"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Award, Shield, Sparkles, Users } from "lucide-react";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

interface Truth {
  id: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}

const truths: Array<Truth> = [
  {
    id: "0b582fbc-7059-46ed-9025-f4c26ba91ed6",
    icon: Sparkles,
    title: "Empowerment for All",
    description:
      "Every woman deserves to feel beautiful, confident, and empowered, regardless of age, size, or background.",
  },
  {
    id: "e0f40569-4769-4210-b188-63568b6da350",
    icon: Shield,
    title: "Safe & Professional",
    description:
      "Professional boudoir photographers create a safe, comfortable environment where you're always in control.",
  },
  {
    id: "44cd0fc9-3114-4c2a-bdc5-a820499d3493",
    icon: Award,
    title: "Artistic Excellence",
    description:
      "Boudoir photography is a respected art form that celebrates femininity with taste and elegance.",
  },
  {
    id: "2fb38363-94ca-407d-900a-aa8967f89f6f",
    icon: Users,
    title: "Life-Changing Experience",
    description:
      "Most clients describe their boudoir session as transformative, boosting confidence for years to come.",
  },
];

export default function TruthSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const truthsRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("myths.truth_section");

  useEffect(() => {
    const section = sectionRef.current;
    const title = titleRef.current;
    const truthsContainer = truthsRef.current;

    if (!section || !title || !truthsContainer) return;

    // Initial states
    gsap.set([title, ...truthsContainer.children], {
      opacity: 0,
      y: 50,
    });

    // Animation on scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 50%",
        end: "bottom 30%",
        toggleActions: "play none none reverse",
      },
    });

    tl.to(title, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
    }).to(
      truthsContainer.children,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.2,
      },
      "-=0.4",
    );
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2
          ref={titleRef}
          className={`${dancingScript.className} text-3xl md:text-5xl font-serif text-chocolate-martini-700 text-center mb-16`}
        >
          {t("title")}
        </h2>

        <div
          ref={truthsRef}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {truths.map((truth, index) => {
            const IconComponent = truth.icon;
            return (
              <div
                key={index}
                className="text-center p-6 bg-cream-tan-50 rounded-2xl hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-16 h-16 bg-chanterelle-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-chocolate-martini-500 mb-4">
                  {t(`cards.${index}.title`)}
                </h3>
                <p className="text-chanterelle-700 leading-relaxed">
                  {t(`cards.${index}.description`)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-gradient-to-r from-chanterelle-500 to-chocolate-martini-500 rounded-3xl p-8 md:p-12 text-center">
          <h3
            className={`${dancingScript.className}  text-2xl md:text-3xl font-serif text-white mb-6`}
          >
            {t("cta.title")}
          </h3>
          <p
            className={`${arefRuqaa.className} text-cream-tan-100 text-lg mb-8 max-w-3xl mx-auto`}
          >
            {t("cta.paragraph")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className={`${arefRuqaa.className} text-white hover:bg-cream-tan-600 px-8 py-4 rounded-full font-semibold transition-colors duration-300`}
            >
              {t("cta.learn_more")}
            </button>
            <button
              className={`${arefRuqaa.className} border-2 border-white text-white hover:bg-white hover:text-chocolate-martini-500 px-8 py-4 rounded-full font-semibold transition-all duration-300`}
            >
              {t("cta.view_portfolio")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
