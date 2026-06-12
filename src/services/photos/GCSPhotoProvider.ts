import { concurrentMap } from "@/lib/async";
import { createGCPStorageClient } from "@/lib/gcp/storage-client";
import { Storage } from "@google-cloud/storage";
import { captureException } from "@sentry/nextjs";

import type { Photo } from "@/types/photos";
import type { ListPhotosOptions, PhotoProvider } from "./PhotoInterfaces";
import { DEFAULT_LIST_OPTIONS } from "./PhotoInterfaces";

const DEFAULT_BUCKET_NAME = "sensuelle-boudoir-website";
const ID_PATTERN = /_(\d+)_o$/;
const FALLBACK_ID_PATTERN = /(\d+)$/;
const FILE_EXT_PATTERN = /\.[^/.]+$/;
const SUFFIX_PATTERN = /_\d+_o$/;
const DASH_UNDERSCORE_PATTERN = /[-_]/g;
const IMAGE_EXT_PATTERN = /\.(jpg|jpeg|png|gif|webp)$/i;

interface GCSPhotoProviderOptions {
  bucketName?: string;
}

interface GCSFile {
  name: string;
  metadata?: {
    metadata?: Record<string, string | undefined>;
    updated?: string;
    timeCreated?: string;
  };
  publicUrl(): string;
}

const extractIdFromFilename = (filename: string): number | null => {
  const nameWithoutExt = filename.replace(FILE_EXT_PATTERN, "");

  const match = ID_PATTERN.exec(nameWithoutExt);
  if (match?.[1]) {
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const fallbackMatch = FALLBACK_ID_PATTERN.exec(nameWithoutExt);
  if (fallbackMatch?.[1]) {
    const parsed = Number(fallbackMatch[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const extractTitleFromFilename = (filename: string): string => {
  const nameWithoutExt = filename.replace(FILE_EXT_PATTERN, "");
  const nameWithoutSuffix = nameWithoutExt.replace(SUFFIX_PATTERN, "");

  return (
    nameWithoutSuffix
      .replaceAll(DASH_UNDERSCORE_PATTERN, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ") || filename
  );
};

const parseDate = (value: string | undefined, fallback: Date): Date => {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const FALLBACK_DATE = new Date(0);

export class GCSPhotoProvider implements PhotoProvider {
  readonly name = "GCS";

  private readonly storage: Storage;
  private readonly bucketName: string;
  private fileCache: Map<number | string, GCSFile> | null = null;
  private isCacheInitialized = false;
  private cacheInitPromise: Promise<void> | null = null;

  constructor(options: GCSPhotoProviderOptions = {}) {
    const {
      bucketName = process.env.GCP_HOMEPAGE_BUCKET ?? DEFAULT_BUCKET_NAME,
    } = options;

    this.bucketName = bucketName;
    this.storage = createGCPStorageClient();
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

      const imageFiles = files.filter((file) => IMAGE_EXT_PATTERN.test(file.name));
      const mapped = await concurrentMap(
        imageFiles,
        (file) => this.mapFileToPhoto(file),
        10,
      );
      const photos = mapped.filter((photo): photo is Photo => photo !== null);

      const sortedPhotos = (() => {
        if (opts.orderBy === "date") {
          return [...photos].sort((a, b) =>
            opts.orderDirection === "asc"
              ? a.dateUpload.getTime() - b.dateUpload.getTime()
              : b.dateUpload.getTime() - a.dateUpload.getTime(),
          );
        }

        if (opts.orderBy === "views") {
          return [...photos].sort((a, b) =>
            opts.orderDirection === "asc" ? a.views - b.views : b.views - a.views,
          );
        }

        if (opts.orderBy === "name") {
          return [...photos].sort((a, b) =>
            opts.orderDirection === "asc"
              ? a.title.localeCompare(b.title)
              : b.title.localeCompare(a.title),
          );
        }

        return photos;
      })();

      return opts.limit && opts.limit > 0 ? sortedPhotos.slice(0, opts.limit) : sortedPhotos;
    } catch (error) {
      captureException(error);
      console.error(
        `[${this.name}] Failed to list photos from bucket ${this.bucketName}:`,
        error,
      );
      return null;
    }
  }

  private async ensureCacheInitialized(): Promise<void> {
    if (this.isCacheInitialized) return;

    if (this.cacheInitPromise) {
      return this.cacheInitPromise;
    }

    this.cacheInitPromise = (async () => {
      this.fileCache = new Map<number | string, GCSFile>();
      const bucket = this.storage.bucket(this.bucketName);
      const [files] = await bucket.getFiles({ autoPaginate: false });

      for (const file of files) {
        const fileId = extractIdFromFilename(file.name);
        if (fileId === null) continue;

        this.fileCache.set(fileId, file);
        this.fileCache.set(String(fileId), file);
      }

      this.isCacheInitialized = true;
      this.cacheInitPromise = null;

      setTimeout(() => {
        this.fileCache = null;
        this.isCacheInitialized = false;
      }, 5 * 60 * 1000);
    })();

    return this.cacheInitPromise;
  }

  async getPhoto(id: string | number): Promise<Photo | null> {
    try {
      await this.ensureCacheInitialized();

      const targetId = typeof id === "string" ? Number(id) : id;
      const file = this.fileCache?.get(targetId) || this.fileCache?.get(id);

      if (file) {
        return this.mapFileToPhoto(file);
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
    const dateUpload = parseDate(metadata?.updated ?? metadata?.timeCreated, FALLBACK_DATE);

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
          src: file.publicUrl(),
          width: 0,
          height: 0,
          title,
          description: "",
        },
      ],
    };
  }
}

export const createGCSPhotoProvider = (
  options?: GCSPhotoProviderOptions,
): PhotoProvider => new GCSPhotoProvider(options);
