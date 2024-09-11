import { getFlickrPhotos } from "@/services/flickr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = params.get("query") ?? "boudoir";
  const items = params.get("items") ?? "10";
  try {
    console.log(`Fetching ${items} for ${params.get("query")}`);
    const value = await getFlickrPhotos(query, items);

    return NextResponse.json({
      success: true,
      photos: value.photos,
      reason: "",
    });
  } catch (reason) {
    return NextResponse.json({
      success: false,
      reason: reason,
      photos: [],
    });
  }
}
