import { createGCPStorageClient } from "@/lib/gcp/storage-client";
import { randomUUID } from "node:crypto";

type ReleaseObject = {
  save: (
    data: Buffer,
    options: {
      resumable: boolean;
      contentType: string;
      metadata: { metadata: Record<string, string> };
    },
  ) => Promise<void>;
};

type ReleaseBucket = {
  file: (name: string) => ReleaseObject;
};

type ReleaseStorage = {
  bucket: (name: string) => ReleaseBucket;
};

export const archiveReleasePdf = async (
  pdf: Buffer,
  sessionDate: string,
  releaseType: "photography" | "model" = "photography",
): Promise<string> => {
  const bucketName = process.env.GCP_RELEASES_BUCKET;
  if (!bucketName) {
    throw new Error("GCP_RELEASES_BUCKET is not configured");
  }

  const prefix =
    releaseType === "model" ? "model-releases" : "photography-releases";
  const objectName = `${prefix}/${sessionDate.slice(0, 7)}/${randomUUID()}.pdf`;
  const storage = createGCPStorageClient() as unknown as ReleaseStorage;
  await storage
    .bucket(bucketName)
    .file(objectName)
    .save(pdf, {
      resumable: false,
      contentType: "application/pdf",
      metadata: {
        metadata: {
          sessionDate,
          retention: "indefinite",
        },
      },
    });

  return objectName;
};
