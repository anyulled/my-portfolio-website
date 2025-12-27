import { ImageResponse } from "next/og";
/*eslint-disable @next/next/no-img-element */


export const contentType = "image/png";
export const alt = "Sensuelle Boudoir";
export const size = {
  width: 1200,
  height: 630,
};
export const runtime = "nodejs";

import { getPhotosFromStorage } from "@/services/storage/photos";

async function fetchAndEncodeImage(url: string) {
  if (!url) return null;
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`,
      );
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("image/")) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`Error fetching image from ${url}:`, error);
    // Don't throw, return null so Promise.allSettled or similar can handle it, 
    // or just return null to filter out.
    return null;
  }
}

export default async function PricingImage() {
  try {
    console.log("Fetching Images");
    const photos = await getPhotosFromStorage("pricing") || [];

    // Use first 3 photos or fallback
    const pricingImages = photos.slice(0, 3).map(p => p.urlMedium);

    const validImages = await Promise.all(
      pricingImages.map(url => fetchAndEncodeImage(url))
    );

    const images = validImages.filter((img): img is string => img !== null);

    console.log("Images fetched successfully");

    return new ImageResponse(
      (
        <div tw="flex flex-row w-full h-full bg-white">
          {images.map((src) => (
            <img
              key={crypto.randomUUID()}
              src={src}
              alt="Sensuelle Boudoir"
              tw="h-full object-cover"
            />
          ))}
        </div>
      ),
      {
        width: size.width,
        height: size.height,
      },
    );
  } catch (error) {
    console.error("Error generating OpenGraph image:", error);
    return new ImageResponse(
      (
        <div tw="flex items-center justify-center w-full h-full bg-black">
          <div tw="text-white text-6xl">Sensuelle Boudoir</div>
          <div tw="text-white text-2xl">Pricing Packages</div>
        </div>
      ),
      {
        width: size.width,
        height: size.height,
      },
    );
  }
}
