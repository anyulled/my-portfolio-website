import { Storage } from "@google-cloud/storage";
import { captureException } from "@sentry/nextjs";

import type { Photo, PhotoSource } from "@/types/photos";

const DEFAULT_BUCKET_NAME = "sensuelle-boudoir-homepage";

const VARIANT_TO_FIELD: Record<
  string,
  keyof Pick<
    Photo,
    | "urlCrop"
    | "urlLarge"
    | "urlMedium"
    | "urlNormal"
    | "urlOriginal"
    | "urlSmall"
    | "urlThumbnail"
    | "urlZoom"
  >
> = {
  crop: "urlCrop",
  large: "urlLarge",
  medium: "urlMedium",
  normal: "urlNormal",
  original: "urlOriginal",
  small: "urlSmall",
  thumbnail: "urlThumbnail",
  zoom: "urlZoom",
};

export type StorageClient = Pick<Storage, "bucket">;

export type StorageFileLike = {
  name: string;
  metadata?: {
    metadata?: Record<string, string | undefined>;
    updated?: string;
  };
  publicUrl(): string;
};

type VariantMetadata = {
  path?: string;
  width?: number;
  height?: number;
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
      client_email: process.env.GCP_CLIENT_EMAIL,
      private_key: sanitisePrivateKey(process.env.GCP_PRIVATE_KEY as string),
    },
  });
};

const parseVariants = (
  value?: string | null,
): Record<string, VariantMetadata> | null => {
  if (!value) return null;

  try {
    return JSON.parse(value) as Record<string, VariantMetadata>;
  } catch (error) {
    console.warn("[HomepageStorage] Failed to parse variants metadata", error);
    captureException(error);
    return null;
  }
};

const normaliseBaseUrl = (input: string | undefined, fileUrl: string): string => {
  const base = input ?? fileUrl.replace(/\/$/, "");
  return base.replace(/\/$/, "");
};

const toAbsoluteUrl = (
  path: string | undefined,
  baseUrl: string,
  fallback: string,
): string => {
  if (!path) return fallback;
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const cleaned = path.replace(/^\//, "");
  return `${baseUrl}/${cleaned}`;
};

const parseNumber = (value: string | undefined, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDate = (value: string | undefined, fallback: Date): Date => {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const mapFileToPhoto = (
  file: StorageFileLike,
  baseUrl: string,
): Photo | null => {
  const customMetadata = (file.metadata?.metadata ?? {}) as Record<
    string,
    string | undefined
  >;
  const variants = parseVariants(customMetadata.variants);

  if (!variants || Object.keys(variants).length === 0) {
    return null;
  }

  const description = customMetadata.description ?? customMetadata.caption ?? "";
  const title = customMetadata.title ?? file.name;
  const tags = customMetadata.tags ?? "";
  const width = customMetadata.width ?? "0";
  const height = customMetadata.height ?? "0";
  const fallbackUrl = file.publicUrl();

  const dateUpload = parseDate(
    customMetadata.dateUploaded ?? file.metadata?.updated,
    new Date(0),
  );
  const dateTaken = parseDate(customMetadata.dateTaken, dateUpload);
  const id = parseNumber(customMetadata.id, Number(Date.now()));
  const views = parseNumber(customMetadata.views);

  const photo: Photo = {
    id,
    description,
    dateTaken,
    dateUpload,
    height,
    title,
    urlCrop: fallbackUrl,
    urlLarge: fallbackUrl,
    urlMedium: fallbackUrl,
    urlNormal: fallbackUrl,
    urlOriginal: fallbackUrl,
    urlSmall: fallbackUrl,
    urlThumbnail: fallbackUrl,
    urlZoom: fallbackUrl,
    views,
    width,
    tags,
    srcSet: [],
  };

  const srcSet: PhotoSource[] = [];

  Object.entries(variants).forEach(([variantKey, variantData]) => {
    const url = toAbsoluteUrl(variantData.path, baseUrl, fallbackUrl);
    const variantWidth = variantData.width ?? parseNumber(customMetadata.width, 0);
    const variantHeight = variantData.height ?? parseNumber(customMetadata.height, 0);

    if (VARIANT_TO_FIELD[variantKey]) {
      photo[VARIANT_TO_FIELD[variantKey]] = url;
    }

    srcSet.push({
      src: url,
      width: variantWidth,
      height: variantHeight,
      title,
      description,
    });
  });

  photo.srcSet = srcSet;

  return photo;
};

export const listHomepagePhotos = async (
  storageClient?: StorageClient,
): Promise<Photo[] | null> => {
  const bucketName = process.env.GCP_HOMEPAGE_BUCKET ?? DEFAULT_BUCKET_NAME;
  const baseUrl = normaliseBaseUrl(
    process.env.GCP_HOMEPAGE_CDN_URL,
    `https://storage.googleapis.com/${bucketName}`,
  );

  try {
    const client = storageClient ?? createStorageClient();
    const bucket = client.bucket(bucketName);
    const [files] = await bucket.getFiles({ autoPaginate: false });

    if (!files || files.length === 0) {
      return [];
    }

    const photos = files
      .map((file) => mapFileToPhoto(file, baseUrl))
      .filter((photo): photo is Photo => photo !== null);

    return photos;
  } catch (error) {
    captureException(error);
    console.error(
      `[HomepageStorage] Failed to list objects from bucket ${bucketName}:`,
      error,
    );
    return null;
  }
};

export default listHomepagePhotos;
