import Hero from "@/components/Hero";
import SocialMedia from "@/components/SocialMedia";
import Gallery from "@/components/Gallery";
import ContactForm from "@/components/ContactForm";
import type { Metadata } from "next";
import { getFlickrPhotos } from "@/services/flickr";
import { createFlickr } from "flickr-sdk";
import { Suspense } from "react";
import Loading from "@/app/loading";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Boudoir Barcelona - Home",
  description: "Boudoir photography service in Barcelona",
};

export default async function HomePage() {
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!);
  const res = await getFlickrPhotos(
    flickr,
    "model, boudoir, -cover, woman",
    12,
    false,
    true,
  );

  if (!res.success) {
    return (
      <>
        <h1 className={"text-2xl font-bold text-peach-fuzz-400"}>
          Sensuelle Boudoir
        </h1>
        Error: {res.reason}
      </>
    );
  }

  return (
    <main className={"dark:bg-zinc-900 dark:text-white bg-white text-gray-900"}>
      {/* Hero Section with Parallax */}
      <Hero />

      {/* Gallery Section with Pinterest-like layout */}
      <Suspense fallback={<Loading />}>
        <Gallery photos={res.photos} />
      </Suspense>

      {/* Social Media Links */}
      <SocialMedia />
      <Separator className="my-4" />

      {/* Contact Form Section */}
      <Suspense fallback={<Loading />}>
        <ContactForm />
      </Suspense>
    </main>
  );
}
