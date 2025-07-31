"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { Star } from "lucide-react";
import type { Testimonial } from "@/lib/testimonials";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

interface TestimonialCardProps {
  testimonial: Testimonial;
  index: number;
}

export default function TestimonialCard({
                                          testimonial,
                                          index
                                        }: TestimonialCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("locale");
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    gsap.set(card, {
      opacity: 0,
      y: 50,
      scale: 0.95
    });

    gsap.to(card, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      ease: "power2.out",
      delay: index * 0.1,
      scrollTrigger: {
        trigger: card,
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none reverse"
      }
    });

    const handleMouseEnter = () => {
      gsap.to(card, {
        scale: 1.02,
        y: -5,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    card.addEventListener("mouseenter", handleMouseEnter);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mouseenter", handleMouseEnter);
      card.removeEventListener("mouseleave", handleMouseLeave);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [index]);

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-2xl p-6 shadow-lg border border-mocha-mousse-200 hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-center mb-4">
        {testimonial.image && (
          <Image
            src={testimonial.image || "/placeholder.svg"}
            alt={testimonial.name}
            width={60}
            height={60}
            className="rounded-full object-cover mr-4"
          />
        )}
        <div>
          <h3
            className="font-semibold fill-mocha-mousse-700 text-lg">{testimonial.name}</h3>
          <p
            className="fill-mocha-mousse-600 text-sm">{testimonial.location}</p>
        </div>
      </div>

      <div className="flex mb-3">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i}
                className="w-5 h-5 fill-mocha-mousse-900 text-mocha-mousse-900" />
        ))}
      </div>

      <blockquote className="text-mocha-mousse-700 leading-relaxed italic">
        &quot; {testimonial.content} &quot;
      </blockquote>

      <div className="mt-4 text-xs text-mocha-mousse-600">
        {new Date(testimonial.date).toLocaleDateString(t("date"), {
          year: "numeric",
          month: "long",
          day: "numeric"
        })}
      </div>
    </div>
  );
}