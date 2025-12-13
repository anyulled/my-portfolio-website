/**
 * Google Cloud Storage Photo Provider
 * 
 * Implements PhotoProvider interface for fetching photos from GCS buckets.
 * Supports prefix-based organization for multiple galleries within a single bucket.
 */

import { Storage, File } from "@google-cloud/storage";
import { captureException } from "@sentry/nextjs";

import type { Photo } from "@/types/photos";
import type { PhotoProvider, ListPhotosOptions } from "./PhotoService";
import { DEFAULT_LIST_OPTIONS } from "./PhotoService";

const DEFAULT_BUCKET_NAME = "sensuelle-boudoir-website";
const SIGNED_URL_TTL_MS = 1000 * 60 * 60; // 1 hour

interface GCSPhotoProviderOptions {
    /** GCS bucket name. Defaults to env var GCP_HOMEPAGE_BUCKET or DEFAULT_BUCKET_NAME */
    bucketName?: string;
    /** GCP project ID */
    projectId?: string;
    /** Service account email for signed URLs */
    clientEmail?: string;
    /** Service account private key for signed URLs */
    privateKey?: string;
    /** Whether to use signed URLs (requires credentials) */
    useSignedUrls?: boolean;
}

/**
 * Extracts the photo ID from a filename.
 * Expected format: "name_flickrid_o.jpg" (e.g., "andrea-cano-montull_54701383010_o.jpg")
 */
const extractIdFromFilename = (filename: string): number | null => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

    // Match pattern: anything_NUMBER_o
    const match = nameWithoutExt.match(/_(\d+)_o$/);
    if (match && match[1]) {
        const parsed = Number(match[1]);
        return Number.isFinite(parsed) ? parsed : null;
    }

    // Fallback: trailing number sequence
    const fallbackMatch = nameWithoutExt.match(/(\d+)$/);
    if (fallbackMatch && fallbackMatch[1]) {
        const parsed = Number(fallbackMatch[1]);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
};

/**
 * Extracts and formats a title from a filename.
 * "name-with-dashes_flickrid_o.jpg" → "Name With Dashes"
 */
const extractTitleFromFilename = (filename: string): string => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    const nameWithoutSuffix = nameWithoutExt.replace(/_\d+_o$/, "");

    const title = nameWithoutSuffix
        .replace(/[-_]/g, " ")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

    return title || filename;
};

const parseDate = (value: string | undefined, fallback: Date): Date => {
    const date = value ? new Date(value) : fallback;
    return Number.isNaN(date.getTime()) ? fallback : date;
};

const sanitisePrivateKey = (key: string) => key.replace(/\\n/g, "\n");

export class GCSPhotoProvider implements PhotoProvider {
    readonly name = "GCS";

    private storage: Storage;
    private bucketName: string;
    private useSignedUrls: boolean;

    constructor(options: GCSPhotoProviderOptions = {}) {
        this.bucketName = options.bucketName
            ?? process.env.GCP_HOMEPAGE_BUCKET
            ?? DEFAULT_BUCKET_NAME;

        const hasCredentials = Boolean(
            options.clientEmail ?? process.env.GCP_CLIENT_EMAIL
        ) && Boolean(
            options.privateKey ?? process.env.GCP_PRIVATE_KEY
        );

        this.useSignedUrls = options.useSignedUrls ?? hasCredentials;

        if (hasCredentials) {
            this.storage = new Storage({
                projectId: options.projectId ?? process.env.GCP_PROJECT_ID,
                credentials: {
                    client_email: options.clientEmail ?? process.env.GCP_CLIENT_EMAIL,
                    private_key: sanitisePrivateKey(
                        options.privateKey ?? process.env.GCP_PRIVATE_KEY ?? ""
                    ),
                },
            });
        } else {
            this.storage = new Storage();
        }
    }

    async listPhotos(options: ListPhotosOptions = {}): Promise<Photo[] | null> {
        const opts = { ...DEFAULT_LIST_OPTIONS, ...options };

        try {
            const bucket = this.storage.bucket(this.bucketName);
            const [files] = await bucket.getFiles({
                prefix: opts.prefix,
                autoPaginate: false,
            });

            if (!files || files.length === 0) {
                return [];
            }

            // Filter to only image files
            const imageFiles = files.filter(file =>
                /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
            );

            // Map files to photos
            const mapped = await Promise.all(
                imageFiles.map(file => this.mapFileToPhoto(file))
            );

            let photos = mapped.filter((photo): photo is Photo => photo !== null);

            // Sort
            if (opts.orderBy === "date") {
                photos = photos.sort((a, b) =>
                    opts.orderDirection === "asc"
                        ? a.dateUpload.getTime() - b.dateUpload.getTime()
                        : b.dateUpload.getTime() - a.dateUpload.getTime()
                );
            } else if (opts.orderBy === "views") {
                photos = photos.sort((a, b) =>
                    opts.orderDirection === "asc"
                        ? a.views - b.views
                        : b.views - a.views
                );
            } else if (opts.orderBy === "name") {
                photos = photos.sort((a, b) =>
                    opts.orderDirection === "asc"
                        ? a.title.localeCompare(b.title)
                        : b.title.localeCompare(a.title)
                );
            }

            // Apply limit
            if (opts.limit && opts.limit > 0) {
                photos = photos.slice(0, opts.limit);
            }

            return photos;
        } catch (error) {
            captureException(error);
            console.error(
                `[${this.name}] Failed to list photos from bucket ${this.bucketName}:`,
                error
            );
            return null;
        }
    }

    async getPhoto(id: string | number): Promise<Photo | null> {
        try {
            const bucket = this.storage.bucket(this.bucketName);
            const [files] = await bucket.getFiles({ autoPaginate: false });

            const targetId = typeof id === "string" ? Number(id) : id;

            for (const file of files) {
                const fileId = extractIdFromFilename(file.name);
                if (fileId === targetId) {
                    return this.mapFileToPhoto(file);
                }
            }

            return null;
        } catch (error) {
            captureException(error);
            console.error(`[${this.name}] Failed to get photo ${id}:`, error);
            return null;
        }
    }

    private async mapFileToPhoto(file: File): Promise<Photo | null> {
        const id = extractIdFromFilename(file.name);
        if (id === null) {
            console.warn(
                `[${this.name}] Could not extract ID from filename: ${file.name}. Skipping.`
            );
            return null;
        }

        const title = extractTitleFromFilename(file.name);
        const metadata = file.metadata;
        const dateUpload = parseDate(
            metadata?.updated ?? metadata?.timeCreated,
            new Date(0)
        );

        const url = await this.getUrlForFile(file);

        return {
            id,
            description: "",
            dateTaken: dateUpload,
            dateUpload,
            height: "0",
            title,
            urlCrop: url,
            urlLarge: url,
            urlMedium: url,
            urlNormal: url,
            urlOriginal: url,
            urlSmall: url,
            urlThumbnail: url,
            urlZoom: url,
            views: 0,
            width: "0",
            tags: "",
            srcSet: [
                {
                    src: url,
                    width: 0,
                    height: 0,
                    title,
                    description: "",
                },
            ],
        };
    }

    private async getUrlForFile(file: File): Promise<string> {
        if (this.useSignedUrls) {
            try {
                const [signedUrl] = await file.getSignedUrl({
                    action: "read",
                    expires: Date.now() + SIGNED_URL_TTL_MS,
                });
                return signedUrl;
            } catch (error) {
                console.warn(
                    `[${this.name}] Failed to sign URL for ${file.name}, using public URL`
                );
            }
        }

        return file.publicUrl();
    }
}

// Factory function for convenience
export const createGCSPhotoProvider = (
    options?: GCSPhotoProviderOptions
): PhotoProvider => new GCSPhotoProvider(options);
