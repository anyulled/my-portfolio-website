import { getPhotosFromStorage } from "@/services/storage/photos";
import { Metadata } from "next";
import { Photo } from "@/types/photos";
import BoudoirContent from "@/components/BoudoirContent";
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
  const photos = await getPhotosFromStorage("boudoir/");
  const randomPhotos = getRandomElements(photos ?? [], 10);
  await getTranslations("what_is_boudoir");

  return <BoudoirContent randomPhotos={randomPhotos} />;
}
