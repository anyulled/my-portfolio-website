import { createGCPStorageClient, getGCPCredentials } from "@/lib/gcp/storage-client";



import { getCachedData, setCachedData } from "@/services/cache";
import { getRedisCachedData, setRedisCachedData } from "@/services/redis";
import type { Photo } from "@/types/photos";
import { Storage } from "@google-cloud/storage";
import { captureException } from "@sentry/nextjs";
import chalk from "chalk";

// Backward compatibility export
export const createStorageClient = createGCPStorageClient;


export const DEFAULT_BUCKET_NAME = "sensuelle-boudoir-homepage";
// 1 hour
const SIGNED_URL_TTL_MS = 1000 * 60 * 60;
// 24 hours
const CACHE_TTL_SECONDS = 60 * 60 * 24;

export type StorageClient = Pick<Storage, "bucket">;

type SignedUrlResult = string | [string];

export type StorageFileLike = {
  name: string;
  metadata?: {
    metadata?: Record<string, string | undefined>;
    updated?: string;
  };
  publicUrl(): string;
  getSignedUrl(config: {
    action: "read";
    expires: number | string | Date;
  }): Promise<SignedUrlResult> | SignedUrlResult;
  makePublic?(): Promise<void> | void;
  isPublic(): Promise<[boolean]>;
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
  const matches = value.match(/(\d+)/g);
  if (!matches || matches.length === 0) {
    return null;
  }

  return matches.at(-1) ?? null;
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

const getSignedUrlForFile = async (file: StorageFileLike): Promise<string> => {
  // Skip signing attempt if using ADC without explicit credentials - use public URL directly
  if (!getGCPCredentials().hasCredentials) {
    // Construct URL manually to avoid double-encoding issues
    const bucketName = process.env.GCP_HOMEPAGE_BUCKET ?? DEFAULT_BUCKET_NAME;
    const url = `https://storage.googleapis.com/${bucketName}/${file.name}`;
    return url;
  }

  try {
    const result = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + SIGNED_URL_TTL_MS,
    });

    const [signedUrl] = Array.isArray(result) ? result : [result];

    return signedUrl;
  } catch (error) {
    console.warn(
      chalk.yellow(`[PhotosStorage] Failed to sign URL for ${file.name}`),
      error,
    );

    const [isPublic] = await file.isPublic();
    if (!isPublic && typeof file.makePublic === "function") {
      try {
        await file.makePublic();
      } catch (makePublicError) {
        console.warn(
          chalk.yellow(
            `[PhotosStorage] Failed to make ${file.name} public before falling back to public URL`,
          ),
          makePublicError,
        );
      }
    }

    return file.publicUrl();
  }
};

const mapFileToPhoto = async (file: StorageFileLike): Promise<Photo | null> => {
  const resourceMetadata = file.metadata ?? {};
  const userMetadata = resourceMetadata.metadata ?? {};

  const description = userMetadata.description ?? userMetadata.caption ?? "";
  const title = userMetadata.title ?? file.name;
  const tags = userMetadata.tags ?? "";
  const width = parseNumber(userMetadata.width, 0);
  const height = parseNumber(userMetadata.height, 0);
  const fallbackUrl = file.publicUrl();

  // Use user-provided date, or fallback to file update time
  const dateUpload = parseDate(
    userMetadata.dateUploaded ?? resourceMetadata.updated,
    new Date(0),
  );

  // Try to get ID from metadata first, then fallback to extracting from filename, then to hash
  const metadataId = parsePhotoId(userMetadata.id);
  const filenameId = metadataId ?? parsePhotoId(file.name);

  const id =
    filenameId ??
    (() => {
      const hash = Array.from(file.name).reduce((acc, char) => {
        const charCode = char.codePointAt(0) ?? 0;
        const newHash = (acc << 5) - acc + charCode;
        // Keeping original logic
        return newHash & newHash;
      }, 0);
      const generatedId = Math.abs(hash);
      console.log(
        chalk.cyan(
          `[PhotosStorage] Generated ID ${generatedId} from filename hash for ${file.name}`,
        ),
      );
      return generatedId;
    })();

  const views = parseNumber(userMetadata.views);

  const signedUrl = await getSignedUrlForFile(file);

  const url = signedUrl || fallbackUrl;

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

const filterAndLimitFiles = (
  files: StorageFileLike[],
  limit?: number,
): StorageFileLike[] => {
  const filtered = files.filter(
    (file) =>
      !file.name.endsWith("/") &&
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name),
  );

  return limit && limit > 0 ? filtered.slice(0, limit) : filtered;
};

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
    // Write to Redis (Fast access)
    await setRedisCachedData(cacheKey, photos, CACHE_TTL_SECONDS);
    // Write to Vercel Blob (Persistence)
    await setCachedData(cacheKey, photos, CACHE_TTL_SECONDS);
  } catch (error) {
    console.warn(
      chalk.yellow(`[PhotosStorage] Failed to write to cache for ${cacheKey}:`),
      error,
    );
  }
};

const fetchPhotosFromGCS = async (
  prefix: string,
  storageClient?: StorageClient,
  limit?: number,
): Promise<Photo[] | null> => {
  const bucketName = process.env.GCP_HOMEPAGE_BUCKET ?? DEFAULT_BUCKET_NAME;
  console.log(
    chalk.cyan(
      `[PhotosStorage] Fetching from GCS bucket: ${bucketName}, prefix: ${prefix}, limit: ${limit}`,
    ),
  );

  try {
    const client = storageClient ?? createGCPStorageClient();
    const bucket = client.bucket(bucketName);
    const options = {
      autoPaginate: false,
      prefix,
    };
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

    const filesToProcess = filterAndLimitFiles(files, limit);

    const mapped = await Promise.all(
      filesToProcess
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((file) => mapFileToPhoto(file as any)),
    );

    const photos = mapped.filter((photo): photo is Photo => photo !== null);
    console.log(
      chalk.green(
        `[PhotosStorage] Successfully mapped ${photos.length} photos from ${files.length} files (limit: ${limit})`,
      ),
    );

    return photos;
  } catch (error) {
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
  }
};

export const getPhotosFromStorage = async (
  prefix: string,
  limit?: number,
  storageClient?: StorageClient,
): Promise<Photo[] | null> => {
  const fullCacheKey = `photos-${prefix}`;
  const limitCacheKey = limit ? `photos-${prefix}-limit-${limit}` : null;

  // 1. Try full cache retrieval first (contains superset of data)
  const fullCachedPhotos = await retrievePhotosFromCache(fullCacheKey);
  if (fullCachedPhotos) {
    if (limit && limit > 0) return fullCachedPhotos.slice(0, limit);
    return fullCachedPhotos;
  }

  // 2. Try limit-specific cache retrieval
  if (limitCacheKey) {
    const limitCachedPhotos = await retrievePhotosFromCache(limitCacheKey);
    if (limitCachedPhotos) return limitCachedPhotos;
  }

  // 3. Fetch from GCS
  const fetchedPhotos = await fetchPhotosFromGCS(prefix, storageClient, limit);

  // 4. Store in appropriate cache
  if (fetchedPhotos) {
    if (limit && limit > 0) {
      // If we fetched a limited subset, only cache it as such
      if (limitCacheKey) {
        await storePhotosInCache(limitCacheKey, fetchedPhotos);
      }
    } else {
      // If we fetched everything, cache it as full set
      await storePhotosInCache(fullCacheKey, fetchedPhotos);
    }
  }

  return fetchedPhotos;
};
