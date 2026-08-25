import { Testimonials } from "@/services/database";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const testimonials = await Testimonials();
    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 },
    );
  }
}
