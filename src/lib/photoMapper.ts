import { Photo } from "@/types/photos";
import { Photo as AlbumPhoto } from "react-photo-album";

export type LightboxPhoto = AlbumPhoto & { description?: string };

export interface GalleryImages {
  galleryPhotos: AlbumPhoto[] | undefined;
  lightboxPhotos: LightboxPhoto[] | undefined;
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

  const galleryPhotos: AlbumPhoto[] = [];
  const lightboxPhotos: LightboxPhoto[] = [];

  /*
   * Use a single loop to generate both arrays, reducing iteration overhead
   * compared to chained .map() calls.
   */
  for (const photo of photos) {
    const width = photo.width || DEFAULT_WIDTH;
    const height = photo.height || DEFAULT_HEIGHT;
    const src = photo.srcSet[0]?.src || "";

    /*
     * Construct gallery image (react-photo-album)
     * Note: AlbumPhoto includes srcSet, so this is now type-safe
     */
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
