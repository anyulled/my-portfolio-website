import type { Testimonial } from "@/lib/testimonials";
import type { PricingPackageRecord } from "@/services/database";
import type { Photo } from "@/types/photos";

const fixtureDate = new Date("2024-01-01T00:00:00.000Z");

const fixturePhoto: Photo = {
  id: 1,
  description: "Harness fixture photograph",
  dateTaken: fixtureDate,
  dateUpload: fixtureDate,
  height: 1080,
  title: "Harness fixture photograph",
  views: 1,
  width: 1920,
  tags: "harness fixture",
  srcSet: [
    {
      src: "/images/DSC_7028.jpg",
      width: 1920,
      height: 1080,
      title: "Harness fixture photograph",
      description: "Harness fixture photograph",
    },
  ],
};

export const getHarnessPhotos = (prefix: string, limit?: number): Photo[] => {
  if (prefix === "pricing" || (limit !== undefined && limit <= 0)) {
    return [];
  }

  return [fixturePhoto];
};

export const getHarnessTestimonials = (): Testimonial[] => [
  {
    id: "harness-testimonial",
    name: "Harness Client",
    location: "Barcelona",
    rating: 5,
    content: "A deterministic testimonial for verification.",
    date: fixtureDate,
    featured: true,
  },
];

export const getHarnessPricing = (): PricingPackageRecord => ({
  id: "harness-pricing",
  inserted_at: fixtureDate.toISOString(),
  express_price: 200,
  experience_price: 350,
  deluxe_price: 600,
});
