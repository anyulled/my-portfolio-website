"use client";

import TestimonialCard from "@/components/TestimonialCard";
import type { Testimonial } from "@/lib/testimonials";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { twMerge } from "tailwind-merge";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface TestimonialsGridProps {
  testimonials: Testimonial[];
  className?: string;
  startIndex?: number;
}

export default function TestimonialsGrid({
  testimonials,
  className,
  startIndex = 0,
}: Readonly<TestimonialsGridProps>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Set initial state for all cards to be hidden
      gsap.set(".testimonial-card", { opacity: 0, y: 50, scale: 0.95 });

      ScrollTrigger.batch(".testimonial-card", {
        onEnter: (elements) => {
          gsap.to(
            elements,
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              stagger: 0.1,
              ease: "power2.out",
              overwrite: "auto",
            },
          );
        },
        once: true,
      });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className={twMerge("grid md:grid-cols-2 lg:grid-cols-3 gap-8", className)}
    >
      {testimonials.map((testimonial, index) => (
        <TestimonialCard
          key={testimonial.id}
          testimonial={testimonial}
          index={startIndex + index}
        />
      ))}
    </div>
  );
}
