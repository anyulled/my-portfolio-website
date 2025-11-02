import { Storage } from "@google-cloud/storage";
import { captureException } from "@sentry/nextjs";

import type { Photo } from "@/types/photos";

const DEFAULT_BUCKET_NAME = "sensuelle-boudoir-homepage";
const SIGNED_URL_TTL_MS = 1000 * 60 * 60; // 1 hour

export type StorageClient = Pick<Storage, "bucket">;

type SignedUrlResult = string | [string];

export type StorageFileLike = {
  name: string;
  metadata?: {
    metadata?: Record<string, string | undefined>;
    updated?: string;
  };
  publicUrl(): string;
  getSignedUrl(config: { action: "read"; expires: number | string | Date }):
    | Promise<SignedUrlResult>
    | SignedUrlResult;
  makePublic?(): Promise<void> | void;
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
    console.warn(
      `[HomepageStorage] Failed to sign URL for ${file.name}`,
      error,
    );

    if (typeof file.makePublic === "function") {
      try {
        await file.makePublic();
      } catch (makePublicError) {
        console.warn(
          `[HomepageStorage] Failed to make ${file.name} public before falling back to public URL`,
          makePublicError,
        );
      }
    }

    return file.publicUrl();
  }
};

const mapFileToPhoto = async (file: StorageFileLike): Promise<Photo | null> => {
  const customMetadata = (file.metadata?.metadata ?? {}) as Record<
    string,
    string | undefined
  >;

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
  const id = parsePhotoId(customMetadata.id);
  if (id === null) {
    console.warn(
      `[HomepageStorage] File ${file.name} is missing a valid 'id' in metadata. Skipping.`,
    );
    return null;
  }
  const views = parseNumber(customMetadata.views);

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
    urlSmall: url,
    urlThumbnail: url,
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
