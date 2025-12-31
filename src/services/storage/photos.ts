import { getCachedData, setCachedData } from "@/services/cache";
import { getRedisCachedData, setRedisCachedData } from "@/services/redis";
import type { Photo } from "@/types/photos";
import { Storage } from "@google-cloud/storage";
import { captureException } from "@sentry/nextjs";
import chalk from "chalk";

export const DEFAULT_BUCKET_NAME = "sensuelle-boudoir-homepage";
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

export const createStorageClient = (): Storage => {
  if (!hasCredentials()) {
    console.log(
      chalk.cyan(
        "[PhotosStorage] No explicit GCP credentials found, using Application Default Credentials (ADC)",
      ),
    );
    return new Storage();
  }
  console.log(
    chalk.cyan(
      "[PhotosStorage] Using explicit GCP credentials from environment",
    ),
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

  // Try to get ID from metadata first, then fallback to extracting from filename
  let id = parsePhotoId(userMetadata.id);

  // If no metadata ID, try to extract from filename (e.g., "name_53963952034_o.jpg")
  id ??= parsePhotoId(file.name);

  // If still no ID, generate one from filename hash
  if (id === null) {
    // Simple hash function to generate a numeric ID from filename
    let hash = 0;
    for (let i = 0; i < file.name.length; i++) {
      const char = file.name.codePointAt(i) ?? 0;
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    id = Math.abs(hash);
    console.log(
      chalk.cyan(
        `[PhotosStorage] Generated ID ${id} from filename hash for ${file.name}`,
      ),
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
): Promise<Photo[] | null> => {
  const bucketName = process.env.GCP_HOMEPAGE_BUCKET ?? DEFAULT_BUCKET_NAME;
  console.log(
    chalk.cyan(
      `[PhotosStorage] Fetching from GCS bucket: ${bucketName}, prefix: ${prefix}`,
    ),
  );

  try {
    const client = storageClient ?? createStorageClient();
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

    const mapped = await Promise.all(
      files
        .filter(
          (file) =>
            !file.name.endsWith("/") &&
            /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name),
        )
        .map((file) => mapFileToPhoto(file as StorageFileLike)),
    );

    const photos = mapped.filter((photo): photo is Photo => photo !== null);
    console.log(
      chalk.green(
        `[PhotosStorage] Successfully mapped ${photos.length} photos from ${files.length} files`,
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
  const cacheKey = `photos-${prefix}`;

  // 1. Try cache retrieval
  let photos = await retrievePhotosFromCache(cacheKey);

  // 2. Fetch from GCS if not in cache
  if (!photos) {
    photos = await fetchPhotosFromGCS(prefix, storageClient);

    // 3. Store in cache if fetch was successful
    if (photos) {
      await storePhotosInCache(cacheKey, photos);
    }
  }

  // 4. Apply limit and return
  if (photos && limit && limit > 0) {
    return photos.slice(0, limit);
  }

  return photos;
};
