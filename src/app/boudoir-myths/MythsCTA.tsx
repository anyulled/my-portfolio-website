"use client";

import { Button } from "@/components/ui/button";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BookOpen, Calendar, Camera, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Aref_Ruqaa } from "next/font/google";
import Link from "next/link";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

// Card destinations for internal linking
const cardLinks = [
  // Free Consultation
  { href: "/#book-session", icon: MessageCircle },
  // Style Guide
  { href: "/style-guide", icon: BookOpen },
  // View Portfolio
  { href: "/styles", icon: Camera },
  // Read Reviews (uses star icon)
  { href: "/testimonials", icon: null },
];

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
      y: 50,
    });

    // Animation on scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: cta,
        start: "top 70%",
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
      actions,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
      },
      "-=0.4",
    );

    // Floating animation for action cards
    gsap.to(actions.querySelectorAll(".action-card"), {
      y: -5,
      duration: 2.5,
      ease: "power2.inOut",
      stagger: 0.3,
      repeat: -1,
      yoyo: true,
    });
  }, []);

  return (
    <section ref={ctaRef} className="py-20 bg-muted/50">
      <div className="max-w-6xl mx-auto px-4">
        <div ref={contentRef} className="text-center mb-16">
          <h2
            className={`${arefRuqaa.className} text-3xl md:text-5xl font-serif text-foreground mb-6`}
          >
            {t("heading")}
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-8">
            {t("paragraph")}
          </p>
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-full transition-all duration-300 transform hover:scale-105"
          >
            <Link href="/#book-session">
              <Calendar className="mr-2 h-5 w-5" />
              {t("book_button")}
            </Link>
          </Button>
        </div>

        <div
          ref={actionsRef}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Link
            href={cardLinks[0].href}
            className="action-card bg-card p-6 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300 border border-border cursor-pointer"
          >
            <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("cards.0.title")}
            </h3>
            <p className="text-muted-foreground text-sm">{t("cards.0.text")}</p>
          </Link>

          <Link
            href={cardLinks[1].href}
            className="action-card bg-card p-6 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300 border border-border cursor-pointer"
          >
            <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("cards.1.title")}
            </h3>
            <p className="text-muted-foreground text-sm">{t("cards.1.text")}</p>
          </Link>

          <Link
            href={cardLinks[2].href}
            className="action-card bg-card p-6 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300 border border-border cursor-pointer"
          >
            <Camera className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("cards.2.title")}
            </h3>
            <p className="text-muted-foreground text-sm">{t("cards.2.text")}</p>
          </Link>

          <Link
            href="/testimonials"
            className="action-card bg-card p-6 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300 border border-border cursor-pointer"
          >
            <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-bold text-xl">
                ★
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("cards.3.title")}
            </h3>
            <p className="text-muted-foreground text-sm">{t("cards.3.text")}</p>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm">{t("footer")}</p>
        </div>
      </div>
    </section>
  );
}
