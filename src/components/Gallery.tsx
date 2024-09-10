"use client";
import Image from "next/image";
import "yet-another-react-lightbox/styles.css";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import { Photo } from "@/services/flickr";
import useAnalyticsEventTracker from "@/hooks/eventTracker";
import {useState} from "react";
import Lightbox from "yet-another-react-lightbox";

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

interface GalleryProps {
  photos: Array<Photo>;
}

export default function Gallery({ photos }: GalleryProps) {
  const gaEventTracker = useAnalyticsEventTracker("Gallery");

  const [photoIndex, setPhotoIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const handleImageClick = (image: number) => {
    console.log("Image Clicked");
    gaEventTracker("image_click", `Image ${image}`);
    setLightboxOpen(true);
    setPhotoIndex(image);
  };
  return (
    <>
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2
            className={`${arefRuqaa.className} text-3xl font-bold text-center mb-8`}
          >
            Our Gallery
          </h2>
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {photos.map((image, i) => (
              <div onClick={() => handleImageClick(i)}
                key={image.title.concat(image.views.toString())}
                className="relative overflow-hidden group break-inside-avoid"
              >
                <Image
                  src={image.url}
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
        </div>
      </section>
      {lightboxOpen && (
        <Lightbox
          open={lightboxOpen}
          index={photoIndex}
          close={() => setLightboxOpen(false)}
          slides={photos.map((value) => ({ src: value.url }))}
        />
      )}
    </>
  );
}
