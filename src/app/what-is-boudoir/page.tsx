import { getPhotosFromStorage } from "@/services/storage/photos";
import { Metadata } from "next";
import { Photo } from "@/types/photos";
import BoudoirContent from "@/components/BoudoirContent";
import { getTranslations } from "next-intl/server";

/*eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

export const metadata: Metadata = {
  title: "What is Boudoir?",
  description:
    "What is Boudoir? Uncover the magic of sensuality in our boudoir photography service based in Barcelona, Spain.",
};

/**
 * Selects up to a specified number of random elements from an array.
 *
 * @param arr - The source array of photos; if falsy, an empty array is returned.
 * @param num - The maximum number of elements to return.
 * @returns An array containing at most `num` distinct elements randomly chosen from `arr`.
 */
function getRandomElements(arr: Photo[], num: number) {
  if (!arr) {
    return [];
  }
  const shuffled = arr.toSorted(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

/**
 * Renders the boudoir style page with a randomized selection of photos.
 *
 * Fetches photos and translations, then returns the page component populated with ten randomly chosen photos.
 *
 * @returns A React element representing the boudoir style page populated with a randomized selection of photos.
 */
export default async function BoudoirStylePage() {
  const photos = await getPhotosFromStorage("boudoir/");
  const randomPhotos = getRandomElements(photos ?? [], 10);
  await getTranslations("what_is_boudoir");

  return <BoudoirContent randomPhotos={randomPhotos} />;
}