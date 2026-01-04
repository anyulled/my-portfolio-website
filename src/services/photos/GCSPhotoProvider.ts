/**
 * Google Cloud Storage Photo Provider
 *
 * Implements PhotoProvider interface for fetching photos from GCS buckets.
 * Supports prefix-based organization for multiple galleries within a single bucket.
 */

import { createGCPStorageClient } from "@/lib/gcp/storage-client";
import { Storage } from "@google-cloud/storage";
import { captureException } from "@sentry/nextjs";


import type { Photo } from "@/types/photos";
import type { ListPhotosOptions, PhotoProvider } from "./PhotoInterfaces";
import { DEFAULT_LIST_OPTIONS } from "./PhotoInterfaces";


const DEFAULT_BUCKET_NAME = "sensuelle-boudoir-website";
// 1 hour
const SIGNED_URL_TTL_MS = 1000 * 60 * 60;

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
 * Type representing a Google Cloud Storage file object
 */
interface GCSFile {
  name: string;
  metadata?: {
    metadata?: Record<string, string | undefined>;
    updated?: string;
    timeCreated?: string;
  };
  publicUrl(): string;
  getSignedUrl?(config: { action: string; expires: number }): Promise<[string]>;
}

/**
 * Extracts the photo ID from a filename.
 * Expected format: "name_flickrid_o.jpg" (e.g., "andrea-cano-montull_54701383010_o.jpg")
 */
const extractIdFromFilename = (filename: string): number | null => {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

  // Match pattern: anything_NUMBER_o
  const match = RegExp(/_(\d+)_o$/).exec(nameWithoutExt);
  if (match?.[1]) {
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  // Fallback: trailing number sequence
  const fallbackMatch = RegExp(/(\d+)$/).exec(nameWithoutExt);
  if (fallbackMatch?.[1]) {
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
    .replaceAll(/[-_]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return title || filename;
};

const parseDate = (value: string | undefined, fallback: Date): Date => {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
};


export class GCSPhotoProvider implements PhotoProvider {
  readonly name = "GCS";

  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly useSignedUrls: boolean;

  constructor(options: GCSPhotoProviderOptions = {}) {
    const {
      bucketName = process.env.GCP_HOMEPAGE_BUCKET ?? DEFAULT_BUCKET_NAME,
      useSignedUrls,
    } = options;

    this.bucketName = bucketName;
    this.storage = createGCPStorageClient();

    // Use signed URLs if explicitly requested or if credentials are available
    this.useSignedUrls = useSignedUrls ?? true;
  }

  async listPhotos(options: ListPhotosOptions = {}): Promise<Photo[] | null> {
    const opts = { ...DEFAULT_LIST_OPTIONS, ...options };

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [files] = await bucket.getFiles({
        prefix: opts.prefix,
        autoPaginate: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      if (!files || files.length === 0) {
        return [];
      }

      // Filter to only image files
      const imageFiles = files.filter((file) =>
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name),
      );

      // Map files to photos
      const mapped = await Promise.all(
        imageFiles.map((file) => this.mapFileToPhoto(file)),
      );

      const p0 = mapped.filter((photo): photo is Photo => photo !== null);

      // Sort
      const p1 = (() => {
        if (opts.orderBy === "date") {
          return [...p0].sort((a, b) =>
            opts.orderDirection === "asc"
              ? a.dateUpload.getTime() - b.dateUpload.getTime()
              : b.dateUpload.getTime() - a.dateUpload.getTime(),
          );
        }
        if (opts.orderBy === "views") {
          return [...p0].sort((a, b) =>
            opts.orderDirection === "asc"
              ? a.views - b.views
              : b.views - a.views,
          );
        }
        if (opts.orderBy === "name") {
          return [...p0].sort((a, b) =>
            opts.orderDirection === "asc"
              ? a.title.localeCompare(b.title)
              : b.title.localeCompare(a.title),
          );
        }
        return p0;
      })();

      // Apply limit
      const photos =
        opts.limit && opts.limit > 0 ? p1.slice(0, opts.limit) : p1;

      return photos;
    } catch (error) {
      captureException(error);
      console.error(
        `[${this.name}] Failed to list photos from bucket ${this.bucketName}:`,
        error,
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

  private async mapFileToPhoto(file: GCSFile): Promise<Photo | null> {
    const id = extractIdFromFilename(file.name);
    if (id === null) {
      console.warn(
        `[${this.name}] Could not extract ID from filename: ${file.name}. Skipping.`,
      );
      return null;
    }

    const title = extractTitleFromFilename(file.name);
    const metadata = file.metadata;
    const dateUpload = parseDate(
      metadata?.updated ?? metadata?.timeCreated,
      new Date(0),
    );

    const url = await this.getUrlForFile(file);

    return {
      id,
      description: "",
      dateTaken: dateUpload,
      dateUpload,
      height: 0,
      title,
      views: 0,
      width: 0,
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

  private async getUrlForFile(file: GCSFile): Promise<string> {
    if (this.useSignedUrls && file.getSignedUrl) {
      try {
        const [signedUrl] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + SIGNED_URL_TTL_MS,
        });
        return signedUrl;
      } catch {
        // Silently fall back to public URL
      }
    }

    return file.publicUrl();
  }
}

// Factory function for convenience
export const createGCSPhotoProvider = (
  options?: GCSPhotoProviderOptions,
): PhotoProvider => new GCSPhotoProvider(options);
