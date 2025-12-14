"use client";
import React from "react";
import { useFadeIn } from "@/hooks/useFadeIn";

interface FadeInImageProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
  stagger?: number;
  index?: number;
  ease?: string;
}

export default function FadeInImage({
  children,
  delay = 0.2,
  duration = 1.2,
  ease = "power2.out",
  className = "",
  threshold = 0.3,
  stagger = 0.1,
  index = 0,
}: Readonly<FadeInImageProps>) {
  const containerRef = useFadeIn({
    delay,
    duration,
    ease,
    threshold,
    stagger,
    index,
    y: 20,
    start: `top bottom-=${threshold * 50}%`,
  });

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
