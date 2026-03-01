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
  /*
   * Using any or casting to Image to allow extra properties like title and description
   * for yet-another-react-lightbox
   */
  const lightboxPhotos: Image[] = [];

  for (const photo of photos) {
    const src = photo.srcSet[0]?.src || "";
    const width = photo.width || DEFAULT_WIDTH;
    const height = photo.height || DEFAULT_HEIGHT;

    galleryPhotos.push({
      src,
      srcSet: photo.srcSet,
      alt: photo.title,
      width,
      height,
    } as Image);

    lightboxPhotos.push({
      src,
      srcSet: photo.srcSet,
      alt: photo.title,
      width,
      height,
      title: photo.title,
      description: photo.description,
    } as Image);
  }

  return { galleryPhotos, lightboxPhotos };
};

export default mapPhotosToGalleryImages;
