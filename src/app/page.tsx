import Loading from "@/app/loading";
import Gallery from "@/components/Gallery";
import Hero from "@/components/Hero";
import SocialMedia from "@/components/SocialMedia";
import { Separator } from "@/components/ui/separator";
import { getPhotosFromStorage } from "@/services/storage/photos-cached";
import { getProfessionalPortfolioCopy } from "@/lib/professionalPortfolioCopy";
import type { Locale } from "@/i18n/config";
import type { Photo } from "@/types/photos";
import { randomInt } from "node:crypto";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Boudoir Photography in Barcelona",
  description:
    "Intimate, elegant boudoir photography in Barcelona, with empowering portraits, expert guidance, luxe styling, and a private experience tailored to you.",
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

async function selectRandomPhoto(photos: Photo[]): Promise<Photo | null> {
  "use cache";

  return photos.length > 0 ? photos[randomInt(photos.length)] : null;
}

export default async function HomePage() {
  const locale = (await getLocale()) as Locale;
  const portfolioCopy = getProfessionalPortfolioCopy(locale);
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
  const selectedPhoto = await selectRandomPhoto(heroPhotos);

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
      <section className="container mx-auto max-w-4xl space-y-4 px-6 py-12">
        <h2 className="text-3xl font-semibold">{portfolioCopy.title}</h2>
        <p>{portfolioCopy.intro}</p>
        <p>{portfolioCopy.privacy}</p>
        <div className="flex flex-wrap gap-6">
          <Link
            href="/professional-portfolio-photography"
            className="text-primary underline"
          >
            {portfolioCopy.enquiry}
          </Link>
          <Link href="/pricing" className="text-primary underline">
            {portfolioCopy.pricingLink}
          </Link>
        </div>
      </section>
      <Suspense fallback={<Loading />}>
        {galleryPhotos.length > 0 && <Gallery photos={galleryPhotos} />}
      </Suspense>
      <SocialMedia />
      <Separator className="my-4 bg-border" />
    </main>
  );
}
