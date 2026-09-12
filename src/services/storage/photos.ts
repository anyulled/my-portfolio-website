import { createGCPStorageClient } from "@/lib/gcp/storage-client";

import { concurrentMap } from "@/lib/async";
import { getCachedData, setCachedData } from "@/services/cache";
import { getRedisCachedData, setRedisCachedData } from "@/services/redis";
import { getHarnessPhotos } from "@/services/harness/fixtures";
import { isHarnessFixtureMode } from "@/services/harness/mode";
import type { Photo } from "@/types/photos";
import { Storage } from "@google-cloud/storage";
import { captureException } from "@sentry/nextjs";
import chalk from "chalk";

// Backward compatibility export
export { createGCPStorageClient as createStorageClient } from "@/lib/gcp/storage-client";

export const DEFAULT_BUCKET_NAME = "sensuelle-boudoir-homepage";
// 12 hours (Safety margin)
const CACHE_TTL_SECONDS = 60 * 60 * 12;

const FALLBACK_DATE = new Date(0);
const IMAGE_EXTENSION_REGEX = /\.(jpg|jpeg|png|gif|webp)$/i;

export type StorageClient = Pick<Storage, "bucket">;

export type StorageFileLike = {
  name: string;
  metadata?: {
    metadata?: Record<string, string | undefined>;
    updated?: string;
  };
  publicUrl(): string;
};

const parseNumber = (value: string | undefined, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDate = (value: string | undefined, fallback: Date): Date => {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const extractTrailingDigits = (value: string): string | null => {
  return value.match(/[0-9]+$/)?.[0] ?? null;
};

const parsePhotoId = (value: string | undefined): number | null => {
  if (!value) return null;

  const direct = Number(value);
  if (Number.isFinite(direct)) {
    return direct;
  }

  const trailingDigits = extractTrailingDigits(value);
  if (!trailingDigits) {
    return null;
  }

  const parsed = Number(trailingDigits);
  return Number.isFinite(parsed) ? parsed : null;
};

const generatePhotoIdFromFilename = (filename: string): number => {
  const hash = Array.from(filename).reduce(
    (currentHash, character) =>
      Math.trunc((currentHash << 5) - currentHash + character.charCodeAt(0)),
    0,
  );
  return Math.abs(hash);
};

const getPublicUrlForFile = (file: StorageFileLike): string => file.publicUrl();

const mapFileToPhoto = async (file: StorageFileLike): Promise<Photo | null> => {
  const resourceMetadata = file.metadata ?? {};
  const userMetadata = resourceMetadata.metadata ?? {};

  const description = userMetadata.description ?? userMetadata.caption ?? "";
  const title = userMetadata.title ?? file.name;
  const tags = userMetadata.tags ?? "";
  const width = parseNumber(userMetadata.width, 0);
  const height = parseNumber(userMetadata.height, 0);

  // Use user-provided date, or fallback to file update time
  const dateUpload = parseDate(
    userMetadata.dateUploaded ?? resourceMetadata.updated,
    FALLBACK_DATE,
  );

  // Try to get ID from metadata first, then fallback to extracting from filename, then to hash
  const metadataId = parsePhotoId(userMetadata.id);
  const filenameId = metadataId ?? parsePhotoId(file.name);

  const id = filenameId ?? generatePhotoIdFromFilename(file.name);

  const views = parseNumber(userMetadata.views);

  const url = getPublicUrlForFile(file);

  const photo: Photo = {
    id,
    description,
    dateTaken: dateUpload,
    dateUpload,
    height,
    title,
    views,
    width,
    tags,
    srcSet: [
      {
        src: url,
        width,
        height,
        title,
        description,
      },
    ],
  };

  return photo;
};

const filterInvalidPhotos = (photos: Photo[]): Photo[] =>
  photos.filter(
    (p) =>
      p.srcSet?.[0]?.src &&
      !p.srcSet[0].src.endsWith("/") &&
      !p.srcSet[0].src.endsWith("%2F"),
  );

const retrievePhotosFromCache = async (
  cacheKey: string,
): Promise<Photo[] | null> => {
  // 1. Try to get from Redis (Metadata Cache)
  try {
    const cachedPhotos = await getRedisCachedData<Photo[]>(cacheKey);
    if (cachedPhotos) {
      console.log(chalk.green(`[PhotosStorage] Redis hit for ${cacheKey}`));
      return filterInvalidPhotos(cachedPhotos);
    }
  } catch (error) {
    console.warn(
      chalk.yellow(
        `[PhotosStorage] Failed to read from Redis for ${cacheKey}:`,
      ),
      error,
    );
  }

  // 2. Try to get from Vercel Blob Cache (Second Layer)
  try {
    const cachedPhotos = await getCachedData<Photo[]>(cacheKey);
    if (cachedPhotos) {
      console.log(
        chalk.green(`[PhotosStorage] Vercel Blob hit for ${cacheKey}`),
      );
      const photos = filterInvalidPhotos(cachedPhotos);
      // Hydrate Redis
      setRedisCachedData(cacheKey, photos, CACHE_TTL_SECONDS);
      return photos;
    }
  } catch (error) {
    console.warn(
      chalk.yellow(
        `[PhotosStorage] Failed to read from cache for ${cacheKey}:`,
      ),
      error,
    );
  }

  return null;
};

const storePhotosInCache = async (
  cacheKey: string,
  photos: Photo[],
): Promise<void> => {
  if (photos.length === 0) return;

  try {
    console.log(
      chalk.cyan(
        `[PhotosStorage] Writing ${photos.length} photos to cache layers`,
      ),
    );
    /*
     * ⚡ Bolt: Execute independent cache writes concurrently via Promise.all
     * to eliminate a request waterfall and reduce latency.
     */
    await Promise.all([
      setRedisCachedData(cacheKey, photos, CACHE_TTL_SECONDS),
      setCachedData(cacheKey, photos, CACHE_TTL_SECONDS),
    ]);
  } catch (error) {
    console.warn(
      chalk.yellow(`[PhotosStorage] Failed to write to cache for ${cacheKey}:`),
      error,
    );
  }
};

const processFetchedFiles = async (
  files: StorageFileLike[],
  limit?: number,
): Promise<Photo[]> => {
  const filesToProcess: StorageFileLike[] = [];

  // Optimized loop: filter and slice in one pass to avoid intermediate arrays
  for (const file of files) {
    if (limit && limit > 0 && filesToProcess.length >= limit) {
      break;
    }

    if (!file.name.endsWith("/") && IMAGE_EXTENSION_REGEX.test(file.name)) {
      filesToProcess.push(file);
    }
  }

  // ⚡ Bolt: Limit concurrency to 10 to avoid GCP rate limits and memory spikes
  const mapped = await concurrentMap(filesToProcess, mapFileToPhoto, 10);

  const photos = mapped.filter((photo): photo is Photo => photo !== null);
  console.log(
    chalk.green(
      `[PhotosStorage] Successfully mapped ${photos.length} photos from ${filesToProcess.length} processed files (total scanned: ${files.length})`,
    ),
  );

  return photos;
};

const handleGCSError = (
  error: unknown,
  bucketName: string,
  prefix: string,
): null => {
  captureException(error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  console.error(
    chalk.red(
      `[PhotosStorage] Failed to list objects from bucket ${bucketName} with prefix ${prefix}:`,
    ),
  );
  console.error(chalk.red(`[PhotosStorage] Error message: ${errorMessage}`));
  if (errorStack) {
    console.error(chalk.red(`[PhotosStorage] Stack trace: ${errorStack}`));
  }
  return null;
};

const fetchPhotosFromGCS = async (
  prefix: string,
  limit?: number,
  storageClient?: StorageClient,
): Promise<Photo[] | null> => {
  const bucketName = process.env.GCP_HOMEPAGE_BUCKET ?? DEFAULT_BUCKET_NAME;
  console.log(
    chalk.cyan(
      `[PhotosStorage] Fetching from GCS bucket: ${bucketName}, prefix: ${prefix}`,
    ),
  );

  try {
    const client = storageClient ?? createGCPStorageClient();
    const bucket = client.bucket(bucketName);
    const options: {
      autoPaginate: boolean;
      prefix: string;
      maxResults?: number;
    } = {
      autoPaginate: false,
      prefix,
    };

    if (limit && limit > 0) {
      /*
       * Fetch a buffer of extra files to account for directories or non-image files
       * that might be filtered out later.
       */
      options.maxResults = limit + 20;
    }

    console.log(
      chalk.cyan(`[PhotosStorage] Calling bucket.getFiles with options:`),
      options,
    );
    const [files] = await bucket.getFiles(options);
    console.log(
      chalk.cyan(`[PhotosStorage] GCS returned ${files?.length ?? 0} files`),
    );

    if (!files || files.length === 0) {
      console.warn(
        chalk.yellow(
          `[PhotosStorage] No files found in GCS for prefix: ${prefix}`,
        ),
      );
      return [];
    }

    return await processFetchedFiles(
      files as unknown as StorageFileLike[],
      limit,
    );
  } catch (error) {
    return handleGCSError(error, bucketName, prefix);
  }
};

const getIntegratedPhotosFromStorage = async (
  prefix: string,
  limit?: number,
  storageClient?: StorageClient,
): Promise<Photo[] | null> => {
  const fullCacheKey = `photos-${prefix}`;

  // 1. Try full cache first (most valuable if present)
  const fullCached = await retrievePhotosFromCache(fullCacheKey);
  if (fullCached) {
    if (limit && limit > 0) return fullCached.slice(0, limit);
    return fullCached;
  }

  // 2. Try partial cache if limit exists
  const partialCacheKey =
    limit && limit > 0 ? `photos-${prefix}-limit-${limit}` : null;
  if (partialCacheKey) {
    const partialCached = await retrievePhotosFromCache(partialCacheKey);
    if (partialCached) return partialCached;
  }

  // 3. Fetch from GCS
  const fetchedPhotos = await fetchPhotosFromGCS(prefix, limit, storageClient);

  // 4. Store
  if (fetchedPhotos) {
    if (limit && limit > 0 && partialCacheKey) {
      // We fetched a partial list, store in partial cache
      await storePhotosInCache(partialCacheKey, fetchedPhotos);
    } else {
      // We fetched full list, store in full cache
      await storePhotosInCache(fullCacheKey, fetchedPhotos);
    }
  }

  return fetchedPhotos;
};

export const getPhotosFromStorage = async (
  prefix: string,
  limit?: number,
  storageClient?: StorageClient,
): Promise<Photo[] | null> =>
  isHarnessFixtureMode()
    ? getHarnessPhotos(prefix, limit)
    : getIntegratedPhotosFromStorage(prefix, limit, storageClient);
