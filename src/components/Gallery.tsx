"use client";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "react-photo-album/rows.css";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import { Aref_Ruqaa } from "next/font/google";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import { Image, RowsPhotoAlbum } from "react-photo-album";
import useAnalyticsEventTracker from "@/hooks/eventTracker";
import renderFadeInNextImage from "@/components/FadeInNextImage";
import { useTranslations } from "next-intl";
import { Photo } from "@/services/flickr/flickr.types";
import FadeInTitle from "@/components/FadeInTitle";

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

  const galleryPhotos: Image[] | undefined = photos?.map((photo: Photo) => ({
    src: photo.urlSmall,
    srcSet: photo.srcSet,
    alt: photo.title,
    blurDataURL: photo.urlThumbnail,
    width: parseInt(photo.width),
    height: parseInt(photo.height),
  }));

  const lightboxPhotos: Image[] | undefined = photos?.map((photo: Photo) => ({
    src: photo.urlOriginal,
    srcSet: photo.srcSet,
    alt: photo.title,
    width: parseInt(photo.width),
    height: parseInt(photo.height),
    title: photo.title,
    description: photo.description,
  }));

  return (
    <>
      <section className="py-6 md:py-3 bg-mocha-mousse-50 dark:bg-mocha-mousse-900">
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
                image: (props, context) => renderFadeInNextImage(
                  { ...props, index: context.index },
                  context
                )
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
