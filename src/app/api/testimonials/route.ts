import { getTestimonials } from "@/lib/testimonials";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

const getCachedTestimonials = unstable_cache(
  getTestimonials,
  ["testimonials"],
  {
    // 1 hour
    revalidate: 3600,
    tags: ["testimonials"],
  },
);

export async function GET() {
  try {
    const testimonials = await getCachedTestimonials();
    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 },
    );
  }
}
