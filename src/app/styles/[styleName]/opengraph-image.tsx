import { ImageResponse } from "next/og";
import { extractNameFromTag } from "@/lib/extractName";
import {styles} from "@/data/styles";
import { getFlickrPhotos } from "@/services/flickr";
import {createFlickr} from "flickr-sdk"; /*eslint-disable @next/next/no-img-element */
/*eslint-disable @next/next/no-img-element */

export default async function OpengraphImage({
  params,
}: {
  params: { styleName: string };
}) {
  const styleName = extractNameFromTag(styles, params.styleName);
  const convertedStyleName = styleName ?? "boudoir";
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!);
  const result = await getFlickrPhotos(flickr, convertedStyleName, 1);
  return new ImageResponse(
    (
      <div tw="flex flex-col w-full h-full items-center justify-center bg-black">
        <div tw="bg-neutral-800 flex flex-row w-full h-full">
          <div tw="w-2/5 py-12 px-4 p-8 flex ">
            <img
              src={result.photos?.at(0)?.urlZoom}
              alt={styleName}
              tw="w-full h-auto rounded-md"
            />
          </div>
          <div tw="mt-8 flex flex-col justify-center align-center">
            <h1 tw="flex items-center justify-center rounded-md border border-transparent ml-20 px-5 pt-3 text-5xl font-medium text-white">
              Sensuelle Boudoir
            </h1>
            <h2 tw="flex items-center justify-center rounded-md border border-transparent ml-20 px-5 py-1 text-3xl font-medium text-neutral-200">
              {styleName}
            </h2>
          </div>
        </div>
      </div>
    ),
  );
}
