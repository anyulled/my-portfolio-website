import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { fetchTestimonialsFromDb } from "@/lib/testimonials";


const getCachedTestimonials = unstable_cache(fetchTestimonialsFromDb, ["testimonials"], {
  revalidate: 3600, // 1 hour
  tags: ["testimonials"]
});

export async function GET() {
  try {
    const testimonials = await getCachedTestimonials();
    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}
