"use client";

import type { Testimonial } from "@/lib/testimonials";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRef } from "react";

interface TestimonialCardProps {
  testimonial: Testimonial;
  index: number;
}

export default function TestimonialCard({
  testimonial,
  index: _index,
}: TestimonialCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("locale");

  const { contextSafe } = useGSAP({ scope: cardRef });

  const handleMouseEnter = contextSafe(() => {
    gsap.to(cardRef.current, {
      scale: 1.02,
      y: -5,
      duration: 0.3,
      ease: "power2.out",
    });
  });

  const handleMouseLeave = contextSafe(() => {
    gsap.to(cardRef.current, {
      scale: 1,
      y: 0,
      duration: 0.3,
      ease: "power2.out",
    });
  });

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="testimonial-card bg-card rounded-2xl p-6 shadow-lg border border-border hover:shadow-xl transition-shadow duration-300"
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
          <h3 className="font-semibold text-foreground text-lg">
            {testimonial.name}
          </h3>
          <p className="text-muted-foreground text-sm">
            {testimonial.location}
          </p>
        </div>
      </div>

      <div className="flex mb-3">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-primary text-primary" />
        ))}
      </div>

      <blockquote
        data-testid="testimonial-content"
        className="text-foreground leading-relaxed italic"
      >
        &quot; {testimonial.content} &quot;
      </blockquote>

      <div className="mt-4 text-xs text-muted-foreground">
        {new Date(testimonial.date).toLocaleDateString(t("date"), {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
    </div>
  );
}
