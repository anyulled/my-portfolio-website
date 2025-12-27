import { Storage } from "@google-cloud/storage";
import { captureException } from "@sentry/nextjs";

import type { Photo } from "@/types/photos";

const DEFAULT_BUCKET_NAME = "sensuelle-boudoir-website";
const SIGNED_URL_TTL_MS = 1000 * 60 * 60; // 1 hour

export type StorageClient = Pick<Storage, "bucket">;

type SignedUrlResult = string | [string];

export type StorageFileLike = {
  name: string;
  metadata?: {
    size?: string | number;
    updated?: string;
    timeCreated?: string;
    contentType?: string;
  };
  publicUrl(): string;
  getSignedUrl(config: {
    action: "read";
    expires: number | string | Date;
  }): Promise<SignedUrlResult> | SignedUrlResult;
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

const parseDate = (value: string | undefined, fallback: Date): Date => {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
};

/**
 * Extracts the photo ID from a filename.
 * Expected format: "name_flickrid_o.jpg" (e.g., "andrea-cano-montull_54701383010_o.jpg")
 * Returns the numeric ID (e.g., 54701383010)
 */
const extractIdFromFilename = (filename: string): number | null => {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

  // Match pattern: anything_NUMBER_o (where NUMBER is the Flickr ID)
  const match = nameWithoutExt.match(/_(\d+)_o$/);
  if (match && match[1]) {
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  // Fallback: try to find any trailing number sequence
  const fallbackMatch = nameWithoutExt.match(/(\d+)$/);
  if (fallbackMatch && fallbackMatch[1]) {
    const parsed = Number(fallbackMatch[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

/**
 * Extracts and formats a title from a filename.
 * Expected format: "name-with-dashes_flickrid_o.jpg"
 * Returns formatted title (e.g., "Andrea Cano Montull")
 */
const extractTitleFromFilename = (filename: string): string => {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

  // Remove the _NUMBER_o suffix
  const nameWithoutSuffix = nameWithoutExt.replace(/_\d+_o$/, "");

  // Convert dashes/underscores to spaces and capitalize each word
  const title = nameWithoutSuffix
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return title || filename;
};

const getUrlForFile = async (file: StorageFileLike): Promise<string> => {
  try {
    const result = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + SIGNED_URL_TTL_MS,
    });
    const [signedUrl] = Array.isArray(result) ? result : [result];
    return signedUrl;
  } catch (error) {
    console.warn(
      `[HomepageStorage] Failed to sign URL for ${file.name}, using public URL`,
    );
    // Bucket has public read access via IAM, so publicUrl() will work
    return file.publicUrl();
  }
};

const mapFileToPhoto = async (file: StorageFileLike): Promise<Photo | null> => {
  const id = extractIdFromFilename(file.name);
  if (id === null) {
    console.warn(
      `[HomepageStorage] Could not extract ID from filename: ${file.name}. Skipping.`,
    );
    return null;
  }

  const title = extractTitleFromFilename(file.name);
  const dateUpload = parseDate(
    file.metadata?.updated ?? file.metadata?.timeCreated,
    new Date(0),
  );

  const url = await getUrlForFile(file);

  const photo: Photo = {
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

  return photo;
};

export const listHomepagePhotos = async (
  storageClient?: StorageClient,
): Promise<Photo[] | null> => {
  const bucketName = process.env.GCP_HOMEPAGE_BUCKET ?? DEFAULT_BUCKET_NAME;

  try {
    const client = storageClient ?? createStorageClient();
    const bucket = client.bucket(bucketName);
    const [files] = await bucket.getFiles({ autoPaginate: false });

    if (!files || files.length === 0) {
      return [];
    }

    const mapped = await Promise.all(
      files.map((file) => mapFileToPhoto(file as StorageFileLike)),
    );

    const photos = mapped.filter((photo): photo is Photo => photo !== null);

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
