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
  if (!arr || arr.length === 0) {
    return [];
  }
  /*
   * ⚡ Bolt: Replaced O(N log N) biased array sorting with O(K) partial Fisher-Yates selection
   * to improve performance when randomly picking a subset of photos.
   */
  const result: Photo[] = [];
  const pool = [...arr];
  // eslint-disable-next-line no-restricted-syntax
  for (let i = 0; i < num && pool.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    // eslint-disable-next-line security/detect-object-injection
    const selected = pool[randomIndex];
    if (selected) {
      result.push(selected);
    }
    // eslint-disable-next-line security/detect-object-injection
    pool[randomIndex] = pool[pool.length - 1] as Photo;
    pool.pop();
  }
  return result;
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
