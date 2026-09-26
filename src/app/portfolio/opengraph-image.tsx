import { getPublishedPortfolioCollections } from "@/services/portfolio/public";
import { fallbackOpenGraphImageUrl } from "@/lib/openGraphImage";
import { ImageResponse } from "next/og";
import { connection } from "next/server";

export const alt = "Featured photography collections by Sensuelle Boudoir";
export const size = { width: 1200, height: 630 };

export default async function PortfolioOpenGraphImage() {
  await connection();
  const collections = await getPublishedPortfolioCollections();
  const image =
    collections[0]?.photos[0]?.publicUrl ?? fallbackOpenGraphImageUrl;

  return new ImageResponse(
    <div tw="flex h-full w-full items-center justify-center bg-neutral-950 text-white">
      <img
        src={image}
        alt="Featured boudoir photography"
        tw="h-full w-1/2 object-cover"
      />
      <div tw="flex h-full w-1/2 flex-col justify-center p-12">
        <h1 tw="text-5xl">Sensuelle Boudoir</h1>
        <h2 tw="text-4xl">Featured Photography</h2>
      </div>
    </div>,
    size,
  );
}
