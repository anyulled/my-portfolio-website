import { fallbackOpenGraphImageUrl } from "@/lib/openGraphImage";
import { getPublishedPortfolioForStyle } from "@/services/portfolio/public";
import { portfolioStyles } from "@/services/portfolio/types";
import { ImageResponse } from "next/og";
import { connection } from "next/server";

export const alt = "Sensuelle Boudoir";
export const size = { width: 1200, height: 630 };

export default async function StyleOpenGraphImage({
  params,
}: {
  params: Promise<{ styleName: string }>;
}) {
  await connection();
  const { styleName } = await params;
  const style = portfolioStyles.find((candidate) => candidate === styleName);
  const collections = style ? await getPublishedPortfolioForStyle(style) : [];
  const image =
    collections[0]?.photos[0]?.publicUrl ?? fallbackOpenGraphImageUrl;

  return new ImageResponse(
    <div tw="flex h-full w-full items-center justify-center bg-neutral-950 text-white">
      <img
        src={image}
        alt={style ?? "Photography style"}
        tw="h-full w-1/2 object-cover"
      />
      <div tw="flex h-full w-1/2 flex-col justify-center p-12">
        <h1 tw="text-5xl">Sensuelle Boudoir</h1>
        <h2 tw="text-4xl">{style?.replaceAll("-", " ") ?? "Photography"}</h2>
      </div>
    </div>,
    size,
  );
}
