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

/**
 * Renders the home page with a hero banner, gallery, social links, separator, and contact form; shows a minimal error view if gallery photos cannot be loaded.
 *
 * The hero banner uses stored hero images when available and falls back to a static image when not.
 *
 * @returns The page's JSX: the full main content (hero, gallery, social media, separator, contact form) or a minimal error fragment when gallery photos are unavailable.
 */
export default async function HomePage() {
  const galleryPhotos = await getPhotosFromStorage("portfolio");
  const heroPhotos = (await getPhotosFromStorage("hero")) || [];

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

  if (!galleryPhotos || galleryPhotos.length === 0) {
    return (
      <>
        <h1 className={"text-2xl font-bold text-mocha-mousse-400"}>
          Sensuelle Boudoir
        </h1>
        Error: Unable to load gallery
      </>
    );
  }

  return (
    <main>
      <Hero images={formattedHeroImages} />
      <Suspense fallback={<Loading />}>
        <Gallery photos={galleryPhotos} />
      </Suspense>
      <SocialMedia />
      <Separator className="my-4 bg-mocha-mousse-900 dark:bg-mocha-mousse-500" />
      <Suspense fallback={<Loading />}>
        <ContactForm />
      </Suspense>
    </main>
  );
}