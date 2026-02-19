import { Photo } from "@/types/photos";
import { Photo as AlbumPhoto } from "react-photo-album";

export interface GalleryPhoto extends AlbumPhoto {
  description?: string;
}

export interface GalleryImages {
  galleryPhotos: AlbumPhoto[] | undefined;
  lightboxPhotos: GalleryPhoto[] | undefined;
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
  const lightboxPhotos: GalleryPhoto[] = [];

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
    });

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
