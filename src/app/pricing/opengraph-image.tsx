import { ImageResponse } from "next/og";
/*eslint-disable @next/next/no-img-element */

export const contentType = "image/png";
export const alt = "Sensuelle Boudoir";
export const size = {
  width: 1200,
  height: 630,
};

async function fetchAndEncodeImage(url: string) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/jpeg;base64,${Buffer.from(buffer).toString("base64")}`;
}

export default async function PricingImage() {
  try {
    const images = await Promise.all([
      fetchAndEncodeImage(
        "https://live.staticflickr.com/65535/53232949297_8eb88c70b6_w_d.jpg",
      ),
      fetchAndEncodeImage(
        "https://live.staticflickr.com/65535/54154502487_981fb48243_w_d.jpg",
      ),
      fetchAndEncodeImage(
        "https://live.staticflickr.com/65535/53307099860_93b77dd6dc_w_d.jpg",
      ),
    ]);

    return new ImageResponse(
      (
        <div tw="flex flex-col md:flex-row w-full py-1 px-1 md:items-center justify-between p-1">
          {images.map((src, index) => (
            <img key={index} width="33%" src={src} alt="Sensuelle Boudoir" />
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
        </div>
      ),
      {
        width: size.width,
        height: size.height,
      },
    );
  }
}
