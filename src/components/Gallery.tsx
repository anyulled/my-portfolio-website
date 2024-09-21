"use client";
import Image from "next/image";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import { Photo } from "@/services/flickr";
import useAnalyticsEventTracker from "@/hooks/eventTracker";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

interface GalleryProps {
  photos: Array<Photo> | null;
  showTitle?: boolean;
}

export default function Gallery({
  photos,
  showTitle = true,
}: Readonly<GalleryProps>) {
  const gaEventTracker = useAnalyticsEventTracker("Gallery");

  const [photoIndex, setPhotoIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const handleImageClick = (image: number) => {
    gaEventTracker("image_click", `Image ${image}`);
    setLightboxOpen(true);
    setPhotoIndex(image);
  };
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
          {photos && (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {photos.map((image, i) => (
                <div
                  onClick={() => handleImageClick(i)}
                  key={image.id}
                  className="relative overflow-hidden group break-inside-avoid"
                >
                  <Image
                    src={image.urlCrop}
                    alt={image.title}
                    width={600}
                    height={400 + (i % 3) * 100}
                    priority
                    className="w-full h-auto transition-all duration-500 ease-in-out opacity-0 group-hover:opacity-100 group-hover:scale-105 rounded-lg"
                    onLoad={(event) =>
                      event.currentTarget.classList.remove("opacity-0")
                    }
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                    <span
                      className={`${dancingScript.className} text-white text-2xl`}
                    >
                      View More
                    </span>
                  </div>
                </div>
              ))}
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
