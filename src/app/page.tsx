import Hero from "@/components/Hero";
import SocialMedia from "@/components/SocialMedia";
import Gallery from "@/components/Gallery";
import ContactForm from "@/components/ContactForm";
import type { Metadata } from "next";
import { getPhotosFromStorage } from "@/services/storage/photos";
import { Suspense } from "react";
import Loading from "@/app/loading";
import { Separator } from "@/components/ui/separator";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export const metadata: Metadata = {
  title: "Boudoir Barcelona - Home",
  description: "Intimate, elegant boudoir photography in Barcelona. Empowering portraits with expert guidance, luxe styling, and a private experience. Book today.",
};

export default async function HomePage() {
  const galleryPhotos = await getPhotosFromStorage("portfolio");
  const heroPhotos = await getPhotosFromStorage("hero") || [];

  const formattedHeroImages = heroPhotos.length > 0 ? heroPhotos.map(p => ({
    image: p.urlLarge,
    position: "center center" // Default position as GCS doesn't store position data yet
  })) : [
    {
      image: "https://live.staticflickr.com/65535/54349881217_a687110589_k_d.jpg", // Fallback if no images found
      position: "left top"
    }
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
