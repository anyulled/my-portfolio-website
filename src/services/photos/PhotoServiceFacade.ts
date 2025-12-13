/**
 * Photo Service
 * 
 * Unified photo fetching service that uses GCS as primary storage
 * with Flickr as fallback for gradual migration.
 */

import { GCSPhotoProvider } from "./GCSPhotoProvider";
import type { PhotoProvider, ListPhotosOptions } from "./PhotoService";
import type { Photo } from "@/types/photos";
import { getFlickrPhotos } from "@/services/flickr/flickr";
import { createFlickr } from "flickr-sdk";

const DEFAULT_BUCKET = "sensuelle-boudoir-website";

/**
 * Maps a Flickr tag to a GCS prefix
 * Tags are used in Flickr, prefixes are used in GCS
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
    /** Whether to enable Flickr fallback */
    enableFlickrFallback?: boolean;
}

interface FetchPhotosOptions extends ListPhotosOptions {
    /** Tags for Flickr fallback (if GCS returns no results) */
    tags?: string[];
    /** Single tag (convenience for single-tag queries) */
    tag?: string;
}

/**
 * Photo Service with GCS primary and Flickr fallback
 */
export class PhotoService {
    private gcsProvider: PhotoProvider;
    private enableFlickrFallback: boolean;

    constructor(options: PhotoServiceOptions = {}) {
        this.gcsProvider = new GCSPhotoProvider({
            bucketName: options.bucketName ?? DEFAULT_BUCKET,
        });
        this.enableFlickrFallback = options.enableFlickrFallback ?? true;
    }

    /**
     * Fetches photos from GCS, falling back to Flickr if needed
     */
    async fetchPhotos(options: FetchPhotosOptions = {}): Promise<Photo[]> {
        const { tag, tags: providedTags = [], ...listOptions } = options;
        const allTags = tag ? [tag, ...providedTags] : providedTags;

        // Determine GCS prefix from tags
        const prefix = listOptions.prefix ?? (allTags.length > 0 ? tagToPrefix(allTags[0]) : undefined);

        // Try GCS first
        const gcsPhotos = await this.gcsProvider.listPhotos({
            ...listOptions,
            prefix,
        });

        if (gcsPhotos && gcsPhotos.length > 0) {
            console.log(`[PhotoService] Loaded ${gcsPhotos.length} photos from GCS (prefix: ${prefix})`);
            return gcsPhotos;
        }

        // Fallback to Flickr if enabled
        if (this.enableFlickrFallback && allTags.length > 0) {
            console.log(`[PhotoService] GCS returned no results, falling back to Flickr for tags: ${allTags.join(", ")}`);
            return this.fetchFromFlickr(allTags, listOptions.limit);
        }

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

    private async fetchFromFlickr(tags: string[], limit?: number): Promise<Photo[]> {
        try {
            if (!process.env.FLICKR_API_KEY) {
                console.warn("[PhotoService] Flickr fallback requested but FLICKR_API_KEY not set");
                return [];
            }

            const { flickr } = createFlickr(process.env.FLICKR_API_KEY);
            const tagString = tags.join(", ");
            const result = await getFlickrPhotos(flickr, tagString, limit ?? 100);

            if (result.success && result.photos) {
                console.log(`[PhotoService] Loaded ${result.photos.length} photos from Flickr`);
                return result.photos;
            }

            return [];
        } catch (error) {
            console.error("[PhotoService] Flickr fallback failed:", error);
            return [];
        }
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
