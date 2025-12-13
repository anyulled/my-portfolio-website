/**
 * Photo Service Types and Interfaces
 * 
 * Provides a unified interface for fetching photos from different storage backends
 * (GCS, Zenfolio, etc.)
 */

import type { Photo } from "@/types/photos";

/**
 * Options for listing photos from a provider
 */
export interface ListPhotosOptions {
    /** Prefix/folder path within the storage (e.g., "styles/boudoir/") */
    prefix?: string;
    /** Filter by tags (provider-specific implementation) */
    tags?: string[];
    /** Maximum number of photos to return */
    limit?: number;
    /** Sort order */
    orderBy?: "date" | "views" | "name";
    /** Sort direction */
    orderDirection?: "asc" | "desc";
}

/**
 * Interface for photo storage providers
 * 
 * Implementations:
 * - GCSPhotoProvider: Google Cloud Storage
 * - (Future) ZenfolioPhotoProvider: Zenfolio API
 */
export interface PhotoProvider {
    /** Provider name for logging/debugging */
    readonly name: string;

    /**
     * Lists photos from the storage backend
     * @param options - Filtering and sorting options
     * @returns Array of photos or null on error
     */
    listPhotos(options?: ListPhotosOptions): Promise<Photo[] | null>;

    /**
     * Gets a single photo by ID
     * @param id - Photo identifier (can be numeric ID or filename)
     * @returns Photo or null if not found
     */
    getPhoto?(id: string | number): Promise<Photo | null>;
}

/**
 * Default options for listing photos
 */
export const DEFAULT_LIST_OPTIONS: ListPhotosOptions = {
    limit: 100,
    orderBy: "date",
    orderDirection: "desc",
};
