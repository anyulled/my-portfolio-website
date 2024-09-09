import { getFlickrPhotos } from "@/services/getFlickrPhotos";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const value = await getFlickrPhotos();

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
