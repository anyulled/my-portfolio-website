import Hero from "@/components/Hero";
import SocialMedia from "@/components/SocialMedia";
import Gallery from "@/components/Gallery";
import ContactForm from "@/components/ContactForm";
import type {Metadata} from "next";
import { listHomepagePhotos } from "@/services/storage/homepage";
import {Suspense} from "react";
import Loading from "@/app/loading";
import {Separator} from "@/components/ui/separator";

import gsap from "gsap";
import {useGSAP} from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export const metadata: Metadata = {
  title: "Boudoir Barcelona - Home",
    description: "Intimate, elegant boudoir photography in Barcelona. Empowering portraits with expert guidance, luxe styling, and a private experience. Book today.",
};

export default async function HomePage() {
  const galleryPhotos = await listHomepagePhotos();

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
      <Hero />
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
