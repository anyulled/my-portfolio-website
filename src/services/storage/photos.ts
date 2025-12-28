import { getCachedData, setCachedData } from "@/services/cache";
import { getRedisCachedData, setRedisCachedData } from "@/services/redis";
import { Storage } from "@google-cloud/storage";
import { captureException } from "@sentry/nextjs";
import type { Photo } from "@/types/photos";

const DEFAULT_BUCKET_NAME = "sensuelle-boudoir-homepage";
const SIGNED_URL_TTL_MS = 1000 * 60 * 60; // 1 hour
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

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

const sanitisePrivateKey = (key: string) =>
  key.replaceAll(String.raw`\n`, "\n");

const hasCredentials = () =>
  Boolean(process.env.GCP_CLIENT_EMAIL && process.env.GCP_PRIVATE_KEY);

const createStorageClient = (): Storage => {
  if (!hasCredentials()) {
    console.log(
      "[PhotosStorage] No explicit GCP credentials found, using Application Default Credentials (ADC)",
    );
    return new Storage();
  }
  console.log(
    "[PhotosStorage] Using explicit GCP credentials from environment",
  );
  return new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
      client_email: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
      private_key: sanitisePrivateKey(process.env.GCP_PRIVATE_KEY as string),
    },
  });
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
  if (!hasCredentials()) {
    // Construct URL manually to avoid double-encoding issues
    const bucketName = process.env.GCP_HOMEPAGE_BUCKET ?? DEFAULT_BUCKET_NAME;
    const url = `https://storage.googleapis.com/${bucketName}/${file.name}`;
    console.log(`[PhotosStorage] Using public URL for ${file.name}: ${url}`);
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
    console.warn(`[PhotosStorage] Failed to sign URL for ${file.name}`, error);

    const [isPublic] = await file.isPublic();
    if (!isPublic && typeof file.makePublic === "function") {
      try {
        await file.makePublic();
      } catch (makePublicError) {
        console.warn(
          `[PhotosStorage] Failed to make ${file.name} public before falling back to public URL`,
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

  // Try to get ID from metadata first, then fallback to extracting from filename
  let id = parsePhotoId(userMetadata.id);

  // If no metadata ID, try to extract from filename (e.g., "name_53963952034_o.jpg")
  id ??= parsePhotoId(file.name);

  // If still no ID, generate one from filename hash
  if (id === null) {
    // Simple hash function to generate a numeric ID from filename
    let hash = 0;
    for (let i = 0; i < file.name.length; i++) {
      const char = file.name.codePointAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    id = Math.abs(hash);
    console.log(
      `[PhotosStorage] Generated ID ${id} from filename hash for ${file.name}`,
    );
  }

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
    urlCrop: url,
    urlLarge: url,
    urlMedium: url,
    urlNormal: url,
    urlOriginal: url,
    urlThumbnail: url,
    urlSmall: url,
    urlZoom: url,
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

export const getPhotosFromStorage = async (
  prefix: string,
  limit?: number,
  storageClient?: StorageClient,
): Promise<Photo[] | null> => {
  const cacheKey = `photos-${prefix}`;

  // 1. Try to get from Redis (Metadata Cache)
  try {
    const cachedPhotos = await getRedisCachedData<Photo[]>(cacheKey);
    if (cachedPhotos) {
      console.log(`[PhotosStorage] Redis hit for ${prefix}`);
      return cachedPhotos;
    }
  } catch (error) {
    console.warn(
      `[PhotosStorage] Failed to read from Redis for ${prefix}:`,
      error,
    );
  }

  // 2. Try to get from Vercel Blob Cache (Second Layer)
  try {
    const cachedPhotos = await getCachedData<Photo[]>(cacheKey);
    if (cachedPhotos) {
      console.log(`[PhotosStorage] Vercel Blob hit for ${prefix}`);
      // Hydrate Redis
      setRedisCachedData(cacheKey, cachedPhotos, CACHE_TTL_SECONDS);
      return cachedPhotos;
    }
  } catch (error) {
    console.warn(
      `[PhotosStorage] Failed to read from cache for ${prefix}:`,
      error,
    );
  }

  // 3. Fetch from GCS
  const bucketName = process.env.GCP_HOMEPAGE_BUCKET ?? DEFAULT_BUCKET_NAME;
  console.log(
    `[PhotosStorage] Fetching from GCS bucket: ${bucketName}, prefix: ${prefix}`,
  );

  try {
    const client = storageClient ?? createStorageClient();
    const bucket = client.bucket(bucketName);
    const options = {
      autoPaginate: false,
      prefix,
    };
    console.log(
      `[PhotosStorage] Calling bucket.getFiles with options:`,
      options,
    );
    const [files] = await bucket.getFiles(options);
    console.log(`[PhotosStorage] GCS returned ${files?.length ?? 0} files`);

    if (!files || files.length === 0) {
      console.warn(
        `[PhotosStorage] No files found in GCS for prefix: ${prefix}`,
      );
      return [];
    }

    const mapped = await Promise.all(
      files.map((file) => mapFileToPhoto(file as StorageFileLike)),
    );

    let photos = mapped.filter((photo): photo is Photo => photo !== null);
    console.log(
      `[PhotosStorage] Successfully mapped ${photos.length} photos from ${files.length} files`,
    );

    if (limit && limit > 0) {
      photos = photos.slice(0, limit);
    }

    // 4. Store in cache (Redis and Vercel Blob)
    try {
      if (photos.length > 0) {
        console.log(
          `[PhotosStorage] Writing ${photos.length} photos to cache layers`,
        );
        // Write to Redis (Fast access)
        await setRedisCachedData(cacheKey, photos, CACHE_TTL_SECONDS);
        // Write to Vercel Blob (Persistence)
        await setCachedData(cacheKey, photos, CACHE_TTL_SECONDS);
      }
    } catch (error) {
      console.warn(
        `[PhotosStorage] Failed to write to cache for ${prefix}:`,
        error,
      );
    }

    return photos;
  } catch (error) {
    captureException(error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(
      `[PhotosStorage] Failed to list objects from bucket ${bucketName} with prefix ${prefix}:`,
    );
    console.error(`[PhotosStorage] Error message: ${errorMessage}`);
    if (errorStack) {
      console.error(`[PhotosStorage] Stack trace: ${errorStack}`);
    }
    return null;
  }
};
