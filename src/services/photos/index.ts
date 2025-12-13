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
