import { Image } from "react-photo-album";
import { Photo } from "@/services/flickr/flickr.types";

export interface GalleryImages {
  galleryPhotos: Image[] | undefined;
  lightboxPhotos: Image[] | undefined;
}

export const mapPhotosToGalleryImages = (
  photos: Array<Photo> | null,
): GalleryImages => {
  if (!photos) {
    return { galleryPhotos: undefined, lightboxPhotos: undefined };
  }

  const galleryPhotos: Image[] = photos.map((photo: Photo) => ({
    src: photo.urlSmall,
    srcSet: photo.srcSet,
    alt: photo.title,
    blurDataURL: photo.urlThumbnail,
    width: parseInt(photo.width),
    height: parseInt(photo.height),
  }));

  const lightboxPhotos: Image[] = photos.map((photo: Photo) => ({
    src: photo.urlOriginal,
    srcSet: photo.srcSet,
    alt: photo.title,
    width: parseInt(photo.width),
    height: parseInt(photo.height),
    title: photo.title,
    description: photo.description,
  }));

  return { galleryPhotos, lightboxPhotos };
};

export default mapPhotosToGalleryImages;
