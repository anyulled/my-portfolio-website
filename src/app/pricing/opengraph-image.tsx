import { ImageResponse } from "next/og";
/*eslint-disable @next/next/no-img-element */

export const runtime = "edge";
export const contentType = "image/png";
export const alt = "Sensuelle Boudoir";
export const size = {
  width: 1200,
  height: 630,
};

export default async function PricingImage() {
  try {
    const imageUrls = [
      "https://live.staticflickr.com/65535/53232949297_8eb88c70b6_c_d.jpg",
      "https://live.staticflickr.com/65535/54154502487_981fb48243_c_d.jpg",
      "https://live.staticflickr.com/65535/53307099860_93b77dd6dc_k_d.jpg",
    ];

    // Fetch all images in parallel
    const imagePromises = imageUrls.map(async (url) => {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      return `data:image/jpeg;base64,${Buffer.from(buffer).toString("base64")}`;
    });

    const images = await Promise.all(imagePromises);

    return new ImageResponse(
      (
        <div tw="flex flex-col md:flex-row w-full py-1 px-1 md:items-center justify-between p-1">
          {images.map((image, index) => (
            <img key={index} width="33%" src={image} alt="Sensuelle Boudoir" />
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
    // Return a fallback image response
    return new ImageResponse(
      (
        <div tw="flex items-center justify-center w-full h-full bg-black">
          <div tw="text-white text-6xl font-bold">Sensuelle Boudoir</div>
        </div>
      ),
      {
        width: size.width,
        height: size.height,
      },
    );
  }
}