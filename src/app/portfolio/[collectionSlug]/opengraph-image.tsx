import { fallbackOpenGraphImageUrl } from "@/lib/openGraphImage";
import { getPublishedPortfolioCollection } from "@/services/portfolio/public";
import { ImageResponse } from "next/og";
import { connection } from "next/server";

export const alt = "Sensuelle Boudoir portfolio collection";
export const size = { width: 1200, height: 630 };

export default async function CollectionOpenGraphImage({
  params,
}: {
  params: Promise<{ collectionSlug: string }>;
}) {
  await connection();
  const { collectionSlug } = await params;
  const collection = await getPublishedPortfolioCollection(collectionSlug);
  const image = collection?.photos[0]?.publicUrl ?? fallbackOpenGraphImageUrl;

  return new ImageResponse(
    <div tw="flex h-full w-full items-center justify-center bg-neutral-950 text-white">
      <img
        src={image}
        alt={collection?.name ?? "Portfolio collection"}
        tw="h-full w-1/2 object-cover"
      />
      <div tw="flex h-full w-1/2 flex-col justify-center p-12">
        <h1 tw="text-4xl">Sensuelle Boudoir</h1>
        <h2 tw="text-4xl">{collection?.name ?? "Portfolio"}</h2>
      </div>
    </div>,
    size,
  );
}
