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

/*
 * ⚡ Bolt: Hoisted the invariant `fallbackGalleryPhotos` array out of the
 * `HomePage` render function. This prevents allocating an array, a large
 * photo object, and two `Date` instances on every server render when
 * fetched gallery photos are unavailable.
 */
const fallbackGalleryPhotos = [
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

export default async function HomePage() {
  // Parallelize data fetching to reduce waterfall effect and improve LCP
  const [fetchedGallery, heroPhotosRaw] = await Promise.all([
    getPhotosFromStorage("boudoir", 12),
    getPhotosFromStorage("hero", 6),
  ]);

  const galleryPhotos =
    fetchedGallery && fetchedGallery.length > 0
      ? fetchedGallery
      : fallbackGalleryPhotos;

  const heroPhotos = heroPhotosRaw || [];

  /*
   * ⚡ Bolt: Selected the random photo FIRST, and then formatted only that single photo
   * into `heroImage`. This prevents mapping over the entire `heroPhotos` array, converting
   * an O(N) allocation into an O(1) allocation and eliminating redundant object creations
   * on every server render.
   */
  const selectedPhoto =
    heroPhotos.length > 0
      ? heroPhotos[Math.floor(Math.random() * heroPhotos.length)]
      : null;

  const heroImage = selectedPhoto
    ? {
        image: selectedPhoto.srcSet[0].src,
        // Default position as GCS doesn't store position data yet
        position: "center center",
        alt:
          selectedPhoto.description || selectedPhoto.title || "Boudoir Session",
      }
    : {
        // Fallback if no images found
        image: "/images/DSC_7028.jpg",
        position: "left top",
        alt: "Boudoir Session",
      };

  return (
    <main>
      <Hero image={heroImage} />
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
