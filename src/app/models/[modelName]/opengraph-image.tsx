import { ImageResponse } from "next/og";
import { extractNameFromTag } from "@/lib/extractName";
import { getFlickrPhotos } from "@/services/flickr";
import modelData from "@/data/models";
import { createFlickr } from "flickr-sdk";
/*eslint-disable @next/next/no-img-element */

export const contentType = "image/png";
export const alt = "Sensuelle Boudoir";
export const size = {
  width: 1200,
  height: 630,
};

export default async function OpengraphImage({
  params,
}: {
  params: { modelName: string };
}) {
  const modelName = extractNameFromTag(modelData, params.modelName);
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!);
  const result = await getFlickrPhotos(flickr, params.modelName, 1);

  return new ImageResponse(
    (
      <div tw="flex flex-col w-full h-full items-center justify-center bg-black">
        <div tw="bg-neutral-800 flex flex-row w-full h-full">
          <div tw="w-2/5 py-12 px-4 p-8 flex ">
            <img
              src={result.photos?.at(0)?.urlZoom}
              alt={modelName}
              tw="w-full h-auto rounded-md"
            />
          </div>
          <div tw="mt-8 flex flex-col justify-center align-center">
            <h1 tw="flex items-center justify-center rounded-md border border-transparent ml-20 px-5 pt-3 text-5xl font-medium text-white">
              Sensuelle Boudoir
            </h1>
            <h2 tw="flex items-center justify-center rounded-md border border-transparent ml-20 px-5 py-1 text-3xl font-medium text-neutral-200">
              Model {modelName}
            </h2>
          </div>
        </div>
      </div>
    ),
  );
}
