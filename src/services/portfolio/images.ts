import "server-only";

import { createGCPStorageClient } from "@/lib/gcp/storage-client";
import { DEFAULT_BUCKET_NAME } from "@/services/storage/photos";
import sharp from "sharp";
import { downloadDriveImage } from "./drive";

export interface UploadedPortfolioPhoto {
  driveFileId: string;
  objectPath: string;
  publicUrl: string;
  altText: string;
  position: number;
}

const getPortfolioBucket = () =>
  process.env.GCP_HOMEPAGE_BUCKET ?? DEFAULT_BUCKET_NAME;

export const uploadDriveImages = async (
  collectionId: string,
  driveImages: Array<{ id: string; name: string }>,
): Promise<UploadedPortfolioPhoto[]> => {
  const storage = createGCPStorageClient();
  const bucketName = getPortfolioBucket();
  const bucket = storage.bucket(bucketName);
  const uploaded: UploadedPortfolioPhoto[] = [];

  try {
    for (const [position, driveImage] of driveImages.entries()) {
      const driveFileId = driveImage.id;
      const source = await downloadDriveImage(driveFileId);
      const { data, info } = await sharp(source.buffer)
        .rotate()
        .resize({
          width: 2560,
          height: 2560,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });
      const objectPath = `portfolio/${collectionId}/${crypto.randomUUID()}.webp`;
      const file = bucket.file(objectPath);
      await file.save(data, {
        resumable: false,
        contentType: "image/webp",
        metadata: {
          cacheControl: "public, max-age=31536000, immutable",
          metadata: {
            width: String(info.width),
            height: String(info.height),
            title: source.name,
          },
        },
      });
      uploaded.push({
        driveFileId,
        objectPath,
        publicUrl: file.publicUrl(),
        altText: source.name,
        position,
      });
    }
    return uploaded;
  } catch (error) {
    await deletePortfolioPhotoObjects(
      uploaded.map((photo) => photo.objectPath),
    );
    throw error;
  }
};

export const deletePortfolioPhotoObjects = async (
  objectPaths: string[],
): Promise<void> => {
  if (objectPaths.length === 0) {
    return;
  }
  const bucket = createGCPStorageClient().bucket(getPortfolioBucket());
  const results = await Promise.allSettled(
    objectPaths.map((objectPath) => bucket.file(objectPath).delete()),
  );
  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length > 0) {
    console.error("portfolio_photo_cleanup_failed", {
      failedCount: failures.length,
    });
  }
};
