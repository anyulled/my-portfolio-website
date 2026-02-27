import { Photo } from "@/types/photos";
import { Image } from "react-photo-album";

export type LightboxImage = Image & {
  title?: string;
  description?: string;
};

export interface GalleryImages {
  galleryPhotos: Image[] | undefined;
  lightboxPhotos: LightboxImage[] | undefined;
}

/*
 * Default dimensions for images without metadata
 * Using a common aspect ratio (3:2) with reasonable default size
 */
const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;

export const mapPhotosToGalleryImages = (
  photos: Array<Photo> | null,
): GalleryImages => {
  if (!photos) {
    return { galleryPhotos: undefined, lightboxPhotos: undefined };
  }

  const galleryPhotos: Image[] = [];
  const lightboxPhotos: LightboxImage[] = [];

  // Optimized loop: map to both formats in a single pass to reduce iterations and allocations
  for (const photo of photos) {
    const baseImage = {
      src: photo.srcSet[0]?.src || "",
      srcSet: photo.srcSet,
      alt: photo.title,
      width: photo.width || DEFAULT_WIDTH,
      height: photo.height || DEFAULT_HEIGHT,
    };

    galleryPhotos.push(baseImage);

    lightboxPhotos.push({
      ...baseImage,
      title: photo.title,
      description: photo.description,
    });
  }

  return { galleryPhotos, lightboxPhotos };
};

export default mapPhotosToGalleryImages;
