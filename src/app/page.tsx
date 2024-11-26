import Hero from "@/components/Hero";
import SocialMedia from "@/components/SocialMedia";
import Gallery from "@/components/Gallery";
import ContactForm from "@/components/ContactForm";
import type { Metadata } from "next";
import { getFlickrPhotos } from "@/services/flickr";
import { createFlickr } from "flickr-sdk";
import { Suspense } from "react";
import Loading from "@/app/loading";

export const metadata: Metadata = {
  title: "Boudoir Barcelona - Home",
  description: "Boudoir photography service in Barcelona",
};

export default async function HomePage() {
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!);
  const res = await getFlickrPhotos(flickr, "boudoir", 12, false, true);

  if (!res.success) {
    return <div>Error: {res.reason}</div>;
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

      {/* Contact Form Section */}
      <Suspense fallback={<Loading />}>
        <ContactForm />
      </Suspense>
    </main>
  );
}
