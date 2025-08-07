import { cache } from "react";
import { Testimonials } from "@/services/database";

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  content: string;
  image?: string;
  date: Date;
  featured: boolean;
}

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  return Testimonials();
});