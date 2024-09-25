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

  const [photoIndex, setPhotoIndex] = useState<number>(-1);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const handleImageClick = (image: number) => {
    gaEventTracker("image_click", `Image ${image}`);
    setLightboxOpen(true);
    setPhotoIndex(image);
  };

  const convertedPhotos: Image[] | undefined = photos?.map((photo) => ({
    src: photo.urlZoom,
    alt: photo.title,
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
              Our Gallery
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
              No photos yet
            </div>
          )}
        </div>
      </section>
      {photos && lightboxOpen && (
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
          slides={photos.map((value) => ({
            src: value.urlOriginal,
            title: value.title,
            description: value.description,
          }))}
        />
      )}
    </>
  );
}
