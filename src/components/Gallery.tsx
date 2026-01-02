"use client";

import renderFadeInNextImage from "@/components/FadeInNextImage";
import FadeInTitle from "@/components/FadeInTitle";
import useAnalyticsEventTracker from "@/hooks/eventTracker";
import mapPhotosToGalleryImages from "@/lib/photoMapper";
import { Photo } from "@/types/photos";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Aref_Ruqaa } from "next/font/google";
import { useState } from "react";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/plugins/captions.css";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

// Dynamically import Lightbox to reduce initial bundle size
// Note: Plugins cannot be dynamically imported as they're not React components
const Lightbox = dynamic(() => import("yet-another-react-lightbox"), {
  ssr: false,
  loading: () => null,
});

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

interface GalleryProps {
  photos: Array<Photo> | null;
  showTitle?: boolean;
}

export default function Gallery({
  photos,
  showTitle = true,
}: Readonly<GalleryProps>) {
  const gaEventTracker = useAnalyticsEventTracker("Gallery");

  //region Component State
  const t = useTranslations("gallery");
  const [photoIndex, setPhotoIndex] = useState<number>(-1);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const handleImageClick = (image: number) => {
    gaEventTracker("image_click", `Image ${image}`);
    setLightboxOpen(true);
    setPhotoIndex(image);
  };
  //endregion

  const { galleryPhotos, lightboxPhotos } = mapPhotosToGalleryImages(photos);

  return (
    <>
      <section className="py-6 md:py-3 bg-background dark:bg-background">
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
              render={{
                image: (props, context) =>
                  renderFadeInNextImage(
                    { ...props, index: context.index },
                    context,
                  ),
              }}
              photos={galleryPhotos}
              defaultContainerWidth={1200}
              onClick={({ index }) => handleImageClick(index)}
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
