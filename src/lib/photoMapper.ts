import { Image } from "react-photo-album";
import { Photo } from "@/types/photos";

export interface GalleryImages {
  galleryPhotos: Image[] | undefined;
  lightboxPhotos: Image[] | undefined;
}

// Default dimensions for images without metadata
// Using a common aspect ratio (3:2) with reasonable default size
const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;



export const mapPhotosToGalleryImages = (
  photos: Array<Photo> | null,
): GalleryImages => {
  if (!photos) {
    return { galleryPhotos: undefined, lightboxPhotos: undefined };
  }

  const galleryPhotos: Image[] = photos.map((photo: Photo) => ({
    src: photo.urlMedium,
    srcSet: photo.srcSet,
    alt: photo.title,
    blurDataURL: photo.urlThumbnail,
    width: photo.width || DEFAULT_WIDTH,
    height: photo.height || DEFAULT_HEIGHT,
  }));

  const lightboxPhotos: Image[] = photos.map((photo: Photo) => ({
    src: photo.urlOriginal,
    srcSet: photo.srcSet,
    alt: photo.title,
    width: photo.width || DEFAULT_WIDTH,
    height: photo.height || DEFAULT_HEIGHT,
    title: photo.title,
    description: photo.description,
  }));

  return { galleryPhotos, lightboxPhotos };
};

export default mapPhotosToGalleryImages;
