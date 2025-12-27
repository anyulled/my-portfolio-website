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

const sanitisePrivateKey = (key: string) => key.replace(/\\n/g, "\n");

const hasCredentials = () =>
  Boolean(process.env.GCP_CLIENT_EMAIL && process.env.GCP_PRIVATE_KEY);

const createStorageClient = (): Storage => {
  if (!hasCredentials()) {
    return new Storage();
  }
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

  return matches[matches.length - 1] ?? null;
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
  const width = userMetadata.width ?? "0";
  const height = userMetadata.height ?? "0";
  const fallbackUrl = file.publicUrl();

  // Use user-provided date, or fallback to file update time
  const dateUpload = parseDate(
    userMetadata.dateUploaded ?? resourceMetadata.updated,
    new Date(0),
  );

  // Prefer user-provided ID (e.g. from Flickr), fallback to parsing GCS ID/Name not recommended for stability but as last resort?
  // Actually the previous code was using resourceMetadata.id (GCS ID).
  // context: we populated GCS with metadata.id = flickr_id. so we MUST use userMetadata.id.

  // Check user metadata id first
  const id = parsePhotoId(userMetadata.id);

  // If not found, log warning? OR fallback?
  // User requirement: "Verified GCS metadata (id...)" implies we rely on it.
  if (id === null) {
    console.warn(
      `[PhotosStorage] File ${file.name} is missing a valid 'id' in metadata. Skipping.`,
    );
    return null;
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
        width: parseNumber(width, 0),
        height: parseNumber(height, 0),
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

  try {
    const client = storageClient ?? createStorageClient();
    const bucket = client.bucket(bucketName);
    const options = {
      autoPaginate: false,
      prefix,
    };
    const [files] = await bucket.getFiles(options);

    if (!files || files.length === 0) {
      return [];
    }

    const mapped = await Promise.all(
      files.map((file) => mapFileToPhoto(file as StorageFileLike)),
    );

    let photos = mapped.filter((photo): photo is Photo => photo !== null);

    if (limit && limit > 0) {
      photos = photos.slice(0, limit);
    }

    // 4. Store in cache (Redis and Vercel Blob)
    try {
      if (photos.length > 0) {
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
    console.error(
      `[PhotosStorage] Failed to list objects from bucket ${bucketName} with prefix ${prefix}:`,
      error,
    );
    return null;
  }
};
