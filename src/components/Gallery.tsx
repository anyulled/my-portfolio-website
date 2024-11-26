"use client";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "react-photo-album/rows.css";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import { Aref_Ruqaa } from "next/font/google";
import { Photo } from "@/services/flickr";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import { Image, RowsPhotoAlbum } from "react-photo-album";
import useAnalyticsEventTracker from "@/hooks/eventTracker";
import renderNextImage from "@/components/NextImage";
import { useTranslations } from "next-intl";

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

interface GalleryProps {
  photos: Array<Photo> | null;
  showTitle?: boolean;
}

const nextImageUrl = (src: string, size: number): string =>
  `/_next/image?url=${encodeURIComponent(src)}&w=${size}&q=75`;

export default function Gallery({
  photos,
  showTitle = true,
}: Readonly<GalleryProps>) {
  const gaEventTracker = useAnalyticsEventTracker("Gallery");

  const t = useTranslations("gallery");
  const [photoIndex, setPhotoIndex] = useState<number>(-1);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const handleImageClick = (image: number) => {
    gaEventTracker("image_click", `Image ${image}`);
    setLightboxOpen(true);
    setPhotoIndex(image);
  };
  const imageSizes = [16, 32, 48, 64, 96, 128, 256, 384];
  const deviceSizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];

  const convertedPhotos: Image[] | undefined = photos?.map((photo) => ({
    src: photo.urlOriginal,
    srcSet: imageSizes
      .concat(...deviceSizes)
      .filter((size) => size <= parseInt(photo.width))
      .map((size) => ({
        src: nextImageUrl(photo.urlOriginal, size),
        width: size,
        title: photo.title,
        description: photo.description,
        height: Math.round(
          (parseInt(photo.height) / parseInt(photo.width)) * size,
        ),
      })),
    alt: photo.title,
    blurDataURL: photo.urlSmall,
    width: parseInt(photo.width),
    height: parseInt(photo.height),
  }));
  return (
    <>
      <section className="py-6 md:py-3">
        <div className="container mx-auto px-6">
          {showTitle && (
            <h2
              className={`${arefRuqaa.className} text-3xl font-bold text-center mb-8`}
            >
              {t("title")}
            </h2>
          )}
          {convertedPhotos && convertedPhotos?.length > 0 ? (
            <RowsPhotoAlbum
              render={{ image: renderNextImage }}
              photos={convertedPhotos}
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
      {convertedPhotos && lightboxOpen && (
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
          slides={convertedPhotos}
        />
      )}
    </>
  );
}
