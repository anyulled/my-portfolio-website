"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Camera, MessageCircle } from "lucide-react";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";

gsap.registerPlugin(ScrollTrigger);

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

export default function MythsCTA() {
  const ctaRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

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
    <section ref={ctaRef} className="py-20 bg-pantone-creamTan100">
      <div className="max-w-6xl mx-auto px-4">
        <div ref={contentRef} className="text-center mb-16">
          <h2
            className={`${dancingScript.className} text-3xl md:text-5xl font-serif text-chocolate-martini-default mb-6`}
          >
            Don't Let Myths Hold You Back
          </h2>
          <p className="text-xl text-chanterelle-700 max-w-4xl mx-auto mb-8">
            Now that you know the truth about boudoir photography, take the next
            step toward your empowering experience. Every woman deserves to feel
            beautiful, confident, and celebrated.
          </p>
          <Button
            size="lg"
            className="bg-chocolate-martini-default hover:bg-chanterelle-default text-white px-8 py-6 text-lg rounded-full transition-all duration-300 transform hover:scale-105"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Book Your Empowering Session
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
              Free Consultation
            </h3>
            <p className="text-chanterelle-700 text-sm">
              Discuss your concerns and learn about our process
            </p>
          </div>

          <div
            className="action-card bg-white p-6 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
            <BookOpen className="h-12 w-12 text-chanterelle- mx-auto mb-4" />
            <h3
              className="text-lg font-semibold text-chocolate-martini-default mb-2">
              Style Guide
            </h3>
            <p className="text-chanterelle-700 text-sm">
              Get our complete preparation and styling guide
            </p>
          </div>

          <div
            className="action-card bg-white p-6 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
            <Camera
              className="h-12 w-12 text-chanterelle-default mx-auto mb-4" />
            <h3
              className="text-lg font-semibold text-chocolate-martini-default mb-2">
              View Portfolio
            </h3>
            <p className="text-chanterelle-700 text-sm">
              See real examples of our tasteful, artistic work
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
              Read Reviews
            </h3>
            <p className="text-chanterelle-700 text-sm">
              Hear from real women about their experiences
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-chanterelle-600 text-sm">
            Still have questions? We're here to help you feel confident and
            informed about your decision.
          </p>
        </div>
      </div>
    </section>
  );
}
