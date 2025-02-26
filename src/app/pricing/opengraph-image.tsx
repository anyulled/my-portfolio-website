import { ImageResponse } from "next/og";
/*eslint-disable @next/next/no-img-element */

export const runtime = "edge";
export const contentType = "image/png";
export const alt = "Sensuelle Boudoir";
export const size = {
  width: 1200,
  height: 630,
};

async function fetchAndEncodeImage(url: string) {
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
    throw error;
  }
}

export default async function PricingImage() {
  try {
    console.log("Fetching Images");
    const images = await Promise.all([
      fetchAndEncodeImage(
        "https://live.staticflickr.com/65535/53232949297_8eb88c70b6_c_d.jpg",
      ),
      fetchAndEncodeImage(
        "https://live.staticflickr.com/65535/54154502487_981fb48243_c_d.jpg",
      ),
      fetchAndEncodeImage(
        "https://live.staticflickr.com/65535/53307099860_93b77dd6dc_k_d.jpg",
      ),
    ]);

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
