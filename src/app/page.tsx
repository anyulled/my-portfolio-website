import Loading from "@/app/loading";
import ContactForm from "@/components/ContactForm";
import Gallery from "@/components/Gallery";
import Hero from "@/components/Hero";
import SocialMedia from "@/components/SocialMedia";
import { Separator } from "@/components/ui/separator";
import { getPhotosFromStorage } from "@/services/storage/photos-cached";
import type { Metadata } from "next";
import { Suspense } from "react";

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
          views: 0,
          width: 1920,
          tags: "boudoir, portrait",
          srcSet: [
            {
              src: "/images/DSC_7028.jpg",
              width: 1920,
              height: 1080,
              title: "Boudoir Session",
              description: "Boudoir Session",
            },
          ],
        },
      ];

  const heroPhotos = (await getPhotosFromStorage("hero", 6)) || [];

  const formattedHeroImages =
    heroPhotos.length > 0
      ? heroPhotos.map((p) => ({
        image: p.srcSet[0].src,
        // Default position as GCS doesn't store position data yet
        position: "center center",
      }))
      : [
        {
          // Fallback if no images found
          image: "/images/DSC_7028.jpg",
          position: "left top",
        },
      ];

  const randomHeroImage =
    formattedHeroImages[Math.floor(Math.random() * formattedHeroImages.length)];

  return (
    <main>
      <Hero image={randomHeroImage} />
      <Suspense fallback={<Loading />}>
        {galleryPhotos.length > 0 && <Gallery photos={galleryPhotos} />}
      </Suspense>
      <SocialMedia />
      <Separator className="my-4 bg-border" />
      <Suspense fallback={<Loading />}>
        <ContactForm />
      </Suspense>
    </main>
  );
}
