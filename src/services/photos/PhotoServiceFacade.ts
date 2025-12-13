/**
 * Photo Service
 * 
 * Unified photo fetching service using GCS as storage.
 */

import { GCSPhotoProvider } from "./GCSPhotoProvider";
import type { PhotoProvider, ListPhotosOptions } from "./PhotoService";
import type { Photo } from "@/types/photos";

const DEFAULT_BUCKET = "sensuelle-boudoir-website";

/**
 * Maps a tag to a GCS prefix
 */
export const tagToPrefix = (tag: string): string => {
    // Normalize the tag: remove dashes, lowercase
    const normalized = tag.toLowerCase().replace(/-/g, "");
    return `${normalized}/`;
};

/**
 * Maps multiple tags to a single primary prefix
 * For pages that query multiple tags, use the first one
 */
export const tagsToPrefix = (tags: string[]): string => {
    if (tags.length === 0) return "";
    return tagToPrefix(tags[0]);
};

interface PhotoServiceOptions {
    /** GCS bucket name */
    bucketName?: string;
}

interface FetchPhotosOptions extends ListPhotosOptions {
    /** Tags for backwards compatibility (mapped to prefix) */
    tags?: string[];
    /** Single tag (convenience for single-tag queries) */
    tag?: string;
}

/**
 * Photo Service using GCS storage
 */
export class PhotoService {
    private gcsProvider: PhotoProvider;

    constructor(options: PhotoServiceOptions = {}) {
        this.gcsProvider = new GCSPhotoProvider({
            bucketName: options.bucketName ?? DEFAULT_BUCKET,
        });
    }

    /**
     * Fetches photos from GCS
     */
    async fetchPhotos(options: FetchPhotosOptions = {}): Promise<Photo[]> {
        const { tag, tags: providedTags = [], ...listOptions } = options;
        const allTags = tag ? [tag, ...providedTags] : providedTags;

        // Determine GCS prefix from tags
        const prefix = listOptions.prefix ?? (allTags.length > 0 ? tagToPrefix(allTags[0]) : undefined);

        // Fetch from GCS
        const gcsPhotos = await this.gcsProvider.listPhotos({
            ...listOptions,
            prefix,
        });

        if (gcsPhotos && gcsPhotos.length > 0) {
            console.log(`[PhotoService] Loaded ${gcsPhotos.length} photos from GCS (prefix: ${prefix})`);
            return gcsPhotos;
        }

        console.warn(`[PhotoService] No photos found in GCS for prefix: ${prefix}`);
        return [];
    }

    /**
     * Fetches photos by style name
     */
    async fetchStylePhotos(styleName: string, limit?: number): Promise<Photo[]> {
        return this.fetchPhotos({
            prefix: `styles/${styleName.toLowerCase()}/`,
            tag: styleName,
            limit,
        });
    }

    /**
     * Fetches photos by model name/tag
     */
    async fetchModelPhotos(modelTag: string, limit?: number): Promise<Photo[]> {
        return this.fetchPhotos({
            prefix: `models/${modelTag.toLowerCase()}/`,
            tag: modelTag,
            limit,
        });
    }

    /**
     * Fetches cover/about photos
     */
    async fetchCoverPhotos(limit?: number): Promise<Photo[]> {
        return this.fetchPhotos({
            prefix: "about/",
            tag: "cover",
            limit,
        });
    }

    /**
     * Fetches boudoir photos
     */
    async fetchBoudoirPhotos(limit?: number): Promise<Photo[]> {
        return this.fetchPhotos({
            prefix: "boudoir/",
            tag: "boudoir",
            limit,
        });
    }
}

// Singleton instance for convenience
let defaultService: PhotoService | null = null;

export const getPhotoService = (options?: PhotoServiceOptions): PhotoService => {
    if (!defaultService || options) {
        defaultService = new PhotoService(options);
    }
    return defaultService;
};

// Convenience functions for common use cases
export const fetchStylePhotos = (styleName: string, limit?: number) =>
    getPhotoService().fetchStylePhotos(styleName, limit);

export const fetchModelPhotos = (modelTag: string, limit?: number) =>
    getPhotoService().fetchModelPhotos(modelTag, limit);

export const fetchCoverPhotos = (limit?: number) =>
    getPhotoService().fetchCoverPhotos(limit);

export const fetchBoudoirPhotos = (limit?: number) =>
    getPhotoService().fetchBoudoirPhotos(limit);
