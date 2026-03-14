import BoudoirContent from "@/components/BoudoirContent";
import { getPhotosFromStorage } from "@/services/storage/photos-cached";
import { Photo } from "@/types/photos";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "What is Boudoir?",
  description:
    "What is Boudoir? Uncover the magic of sensuality in our boudoir photography service based in Barcelona, Spain.",
};

function getRandomElements(arr: Photo[], num: number) {
  if (!arr) {
    return [];
  }
  const shuffled = arr.toSorted(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

export default async function BoudoirStylePage() {
  /*
   * ⚡ Bolt: Execute independent asynchronous operations concurrently
   * to eliminate request waterfalls and reduce server response time.
   */
  const [photos] = await Promise.all([
    getPhotosFromStorage("boudoir/"),
    getTranslations("what_is_boudoir"),
  ]);

  const randomPhotos = getRandomElements(photos ?? [], 10);

  return <BoudoirContent randomPhotos={randomPhotos} />;
}
