/**
 * Photo Services
 * 
 * Unified interface for fetching photos from different storage backends.
 */

// Types and interfaces
export type { PhotoProvider, ListPhotosOptions } from "./PhotoService";
export { DEFAULT_LIST_OPTIONS } from "./PhotoService";

// Providers
export { GCSPhotoProvider, createGCSPhotoProvider } from "./GCSPhotoProvider";

// Unified service with Flickr fallback
export {
    PhotoService,
    getPhotoService,
    fetchStylePhotos,
    fetchModelPhotos,
    fetchCoverPhotos,
    fetchBoudoirPhotos,
    tagToPrefix,
    tagsToPrefix,
} from "./PhotoServiceFacade";
