"use client";
import React from "react";
import { useFadeIn } from "@/hooks/useFadeIn";

interface FadeInTitleProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
}

export default function FadeInTitle({
                                      children,
                                      delay = 0.2,
                                      duration = 0.8,
                                      className = "",
                                      threshold = 0.3
                                    }: Readonly<FadeInTitleProps>) {
  const containerRef = useFadeIn({
    delay,
    duration,
    threshold,
    y: 20
  });

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
