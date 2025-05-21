import {getFlickrPhotos} from "@/services/flickr/flickr";
import {createFlickr} from "flickr-sdk";
import {Metadata} from "next";
import {Photo} from "@/services/flickr/flickr.types";
import BoudoirContent from "@/components/BoudoirContent";
import {getTranslations} from "next-intl/server";

/*eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

export const metadata: Metadata = {
  title: "What is Boudoir?",
};

function getRandomElements(arr: Photo[], num: number) {
  if (!arr) {
    return [];
  }
  const shuffled = arr.toSorted(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

export default async function BoudoirStylePage() {
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!);
  const { photos } = await getFlickrPhotos(flickr, "boudoir, model", 50);
  const randomPhotos = getRandomElements(photos ?? [], 10);
  await getTranslations("what_is_boudoir");

  return <BoudoirContent randomPhotos={randomPhotos}/>;
}