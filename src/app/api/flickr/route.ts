import { getFlickrPhotos } from "@/services/flickr/flickr";
import { NextRequest, NextResponse } from "next/server";
import { createFlickr } from "flickr-sdk";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = params.get("query") ?? "boudoir";
  const items =
    params.get("items") !== null ? parseInt(<string>params.get("items")) : 10;
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!);
  try {
    const value = await getFlickrPhotos(flickr, query, items);

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
