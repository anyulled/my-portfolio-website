/**
 * Photo Services
 *
 * Unified interface for fetching photos from different storage backends.
 */

// Types and interfaces
export { DEFAULT_LIST_OPTIONS } from "./PhotoInterfaces";
export type { ListPhotosOptions, PhotoProvider } from "./PhotoInterfaces";

// Providers
export { createGCSPhotoProvider, GCSPhotoProvider } from "./GCSPhotoProvider";

// Unified library
import {
  fetchBoudoirPhotos,
  fetchCoverPhotos,
  fetchModelPhotos,
  fetchStylePhotos,
  getPhotoLibrary,
  PhotoLibrary,
  tagsToPrefix,
  tagToPrefix,
} from "./PhotoLibrary";

export {
  fetchBoudoirPhotos,
  fetchCoverPhotos,
  fetchModelPhotos,
  fetchStylePhotos,
  getPhotoLibrary,
  PhotoLibrary,
  tagsToPrefix,
  tagToPrefix
};

// Aliases for compatibility
export {
  getPhotoLibrary as getPhotoService,
  PhotoLibrary as PhotoService
};

