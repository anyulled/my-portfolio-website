import { Photo } from "@/types/photos";
import { Image } from "react-photo-album";

export interface GalleryImages {
  galleryPhotos: Image[] | undefined;
  lightboxPhotos: Image[] | undefined;
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
  const lightboxPhotos: Image[] = [];

  /*
   * Use a single loop to generate both arrays, reducing iteration overhead
   * compared to chained .map() calls.
   */
  for (const photo of photos) {
    const width = photo.width || DEFAULT_WIDTH;
    const height = photo.height || DEFAULT_HEIGHT;
    const src = photo.srcSet[0]?.src || "";

    // Construct gallery image (react-photo-album)
    galleryPhotos.push({
      src,
      srcSet: photo.srcSet,
      alt: photo.title,
      width,
      height,
    });

    /*
     * Construct lightbox image (yet-another-react-lightbox)
     * Includes extra metadata like title and description
     */
    lightboxPhotos.push({
      src,
      srcSet: photo.srcSet,
      alt: photo.title,
      width,
      height,
      title: photo.title,
      description: photo.description,
    });
  }

  return { galleryPhotos, lightboxPhotos };
};

export default mapPhotosToGalleryImages;
