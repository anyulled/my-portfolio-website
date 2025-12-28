import Hero from "@/components/Hero";
import SocialMedia from "@/components/SocialMedia";
import Gallery from "@/components/Gallery";
import ContactForm from "@/components/ContactForm";
import type { Metadata } from "next";
import { getPhotosFromStorage } from "@/services/storage/photos";
import { Suspense } from "react";
import Loading from "@/app/loading";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Boudoir Barcelona - Home",
  description:
    "Intimate, elegant boudoir photography in Barcelona. Empowering portraits with expert guidance, luxe styling, and a private experience. Book today.",
};

export default async function HomePage() {
  const fetchedGallery = await getPhotosFromStorage("", 12);
  const galleryPhotos =
    fetchedGallery && fetchedGallery.length > 0
      ? fetchedGallery
      : [
          {
            id: 0,
            description: "Boudoir Session",
            dateTaken: new Date(),
            dateUpload: new Date(),
            height: 1080,
            title: "Boudoir Session",
            urlCrop: "/images/DSC_7028.jpg",
            urlLarge: "/images/DSC_7028.jpg",
            urlMedium: "/images/DSC_7028.jpg",
            urlNormal: "/images/DSC_7028.jpg",
            urlOriginal: "/images/DSC_7028.jpg",
            urlThumbnail: "/images/DSC_7028.jpg",
            urlSmall: "/images/DSC_7028.jpg",
            urlZoom: "/images/DSC_7028.jpg",
            views: 0,
            width: 1920,
            tags: "boudoir, portrait",
            srcSet: [],
          },
        ];

  const heroPhotos = (await getPhotosFromStorage("hero", 1)) || [];

  const formattedHeroImages =
    heroPhotos.length > 0
      ? heroPhotos.map((p) => ({
          image: p.urlLarge,
          position: "center center", // Default position as GCS doesn't store position data yet
        }))
      : [
          {
            image: "/images/DSC_7028.jpg", // Fallback if no images found
            position: "left top",
          },
        ];

  return (
    <main>
      <Hero images={formattedHeroImages} />
      <Suspense fallback={<Loading />}>
        {galleryPhotos.length > 0 && <Gallery photos={galleryPhotos} />}
      </Suspense>
      <SocialMedia />
      <Separator className="my-4 bg-mocha-mousse-900 dark:bg-mocha-mousse-500" />
      <Suspense fallback={<Loading />}>
        <ContactForm />
      </Suspense>
    </main>
  );
}
