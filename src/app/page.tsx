import Hero from "@/components/Hero";
import SocialMedia from "@/components/SocialMedia";
import Gallery from "@/components/Gallery";
import ContactForm from "@/components/ContactForm";
import type { Metadata } from "next";
import { getFlickrPhotos } from "@/services/flickr";
import Loading from "@/app/loading";
import {Suspense} from "react";

export const metadata: Metadata = {
  title: "Boudoir Barcelona - Home",
  description: "Boudoir photography service in Barcelona",
};

export default async function HomePage() {
  const res = await getFlickrPhotos("boudoir", 12, false, true);

  if (!res.success) {
    return <div>Error: {res.reason}</div>;
  }

  return (
    <main className={"dark:bg-zinc-900 dark:text-white bg-white text-gray-900"}>
      {/* Hero Section with Parallax */}
      <Hero />

      {/* Social Media Links */}
      <SocialMedia />

      {/* Gallery Section with Pinterest-like layout */}
      <Suspense fallback={<Loading />}>
        <Gallery photos={res.photos} />
      </Suspense>

      {/* Contact Form Section */}
      <ContactForm />
    </main>
  );
}
