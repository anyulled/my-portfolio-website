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

const parseDimension = (value: string, fallback: number): number => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

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
    width: parseDimension(photo.width, DEFAULT_WIDTH),
    height: parseDimension(photo.height, DEFAULT_HEIGHT),
  }));

  const lightboxPhotos: Image[] = photos.map((photo: Photo) => ({
    src: photo.urlOriginal,
    srcSet: photo.srcSet,
    alt: photo.title,
    width: parseDimension(photo.width, DEFAULT_WIDTH),
    height: parseDimension(photo.height, DEFAULT_HEIGHT),
    title: photo.title,
    description: photo.description,
  }));

  return { galleryPhotos, lightboxPhotos };
};

export default mapPhotosToGalleryImages;
