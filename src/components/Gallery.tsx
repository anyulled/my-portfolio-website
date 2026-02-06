"use client";

import FadeInTitle from "@/components/FadeInTitle";
import useAnalyticsEventTracker from "@/hooks/eventTracker";
import mapPhotosToGalleryImages from "@/lib/photoMapper";
import { Photo } from "@/types/photos";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Aref_Ruqaa } from "next/font/google";
import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import { RenderImageContext, RenderImageProps, RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/plugins/captions.css";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/*
 * Dynamically import Lightbox to reduce initial bundle size
 * Note: Plugins cannot be dynamically imported as they're not React components
 */
const Lightbox = dynamic(() => import("yet-another-react-lightbox"), {
  ssr: false,
  loading: () => null,
});

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

interface GalleryProps {
  photos: Array<Photo> | null;
  showTitle?: boolean;
}

function renderGalleryImage(
  { alt = "", title, sizes }: RenderImageProps,
  { photo, width, height }: RenderImageContext,
) {
  return (
    <div
      className="gallery-item opacity-0 translate-y-4"
      style={{
        width: "100%",
        position: "relative",
        aspectRatio: `${width} / ${height}`,
      }}
    >
      {photo.srcSet && (
        <Image
          fill
          src={photo.src}
          className={"rounded-lg object-cover"}
          alt={alt}
          title={title}
          sizes={sizes}
          quality={85}
          loading="lazy"
        />
      )}
    </div>
  );
}

export default function Gallery({
  photos,
  showTitle = true,
}: Readonly<GalleryProps>) {
  const gaEventTracker = useAnalyticsEventTracker("Gallery");

  const t = useTranslations("gallery");
  const [photoIndex, setPhotoIndex] = useState<number>(-1);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      ScrollTrigger.batch(".gallery-item", {
        onEnter: (elements) => {
          gsap.to(elements, {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.8,
            ease: "power2.out",
          });
        },
        once: true,
      });
    },
    { scope: containerRef }
  );

  const handleImageClick = useCallback(
    (image: number) => {
      gaEventTracker("image_click", `Image ${image}`);
      setLightboxOpen(true);
      setPhotoIndex(image);
    },
    [gaEventTracker],
  );

  const { galleryPhotos, lightboxPhotos } = useMemo(
    () => mapPhotosToGalleryImages(photos),
    [photos]
  );

  const render = useMemo(
    () => ({
      image: renderGalleryImage,
    }),
    [],
  );

  const onPhotoClick = useCallback(
    ({ index }: { index: number }) => handleImageClick(index),
    [handleImageClick],
  );

  return (
    <>
      <section ref={containerRef} className="py-6 md:py-3 bg-background dark:bg-background">
        <div className="container mx-auto px-6">
          {showTitle && (
            <FadeInTitle>
              <h2
                className={`${arefRuqaa.className} text-3xl font-bold text-center mb-8`}
              >
                {t("title")}
              </h2>
            </FadeInTitle>
          )}
          {galleryPhotos && galleryPhotos?.length > 0 ? (
            <RowsPhotoAlbum
              render={render}
              photos={galleryPhotos}
              defaultContainerWidth={1200}
              onClick={onPhotoClick}
            />
          ) : (
            <div
              className={
                "dark:text-neutral-300 text-neutral-800 text-center text-lg"
              }
            >
              {t("no_photos")}
            </div>
          )}
        </div>
      </section>
      {lightboxPhotos && lightboxOpen && (
        <Lightbox
          open={lightboxOpen}
          plugins={[Fullscreen, Zoom, Captions]}
          index={photoIndex}
          close={() => setLightboxOpen(false)}
          captions={{
            descriptionTextAlign: "center",
            descriptionMaxLines: 3,
            showToggle: true,
          }}
          slides={lightboxPhotos}
        />
      )}
    </>
  );
}
