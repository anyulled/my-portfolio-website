import { fetchBoudoirPhotos } from "@/services/photos";
import { Metadata } from "next";
import { Photo } from "@/types/photos";
import BoudoirContent from "@/components/BoudoirContent";
import { getTranslations } from "next-intl/server";

/*eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

export const metadata: Metadata = {
  title: "What is Boudoir?",
  description: "What is Boudoir? Uncover the magic of sensuality in our boudoir photography service based in Barcelona, Spain.",
};

function getRandomElements(arr: Photo[], num: number) {
  if (!arr) {
    return [];
  }
  const shuffled = arr.toSorted(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

export default async function BoudoirStylePage() {
  // Uses GCS primary with Flickr fallback
  const photos = await fetchBoudoirPhotos(50);
  const randomPhotos = getRandomElements(photos ?? [], 10);
  await getTranslations("what_is_boudoir");

  return <BoudoirContent randomPhotos={randomPhotos} />;
}
