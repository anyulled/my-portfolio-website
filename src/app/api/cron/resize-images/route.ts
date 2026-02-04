import {
  createStorageClient,
  DEFAULT_BUCKET_NAME,
} from "@/services/storage/photos";
import chalk from "chalk";
import { NextResponse } from "next/server";
import sharp from "sharp";

// 5 minutes
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MAX_WIDTH_HEIGHT = 2560;

// Define minimal interfaces to avoid library export issues
interface GCSFile {
  name: string;
  metadata: {
    metadata?: {
      width?: string;
      height?: string;
      updated?: string;
      [key: string]: string | undefined;
    };
    contentType?: string;
    size?: string;
    format?: string;

    [key: string]: unknown;
  };
  download(): Promise<[Buffer]>;
  save(data: Buffer, options?: unknown): Promise<unknown>;
  delete(): Promise<unknown>;
}

interface GCSBucket {
  getFiles(): Promise<[GCSFile[]]>;
  file(name: string): GCSFile;
}

interface ProcessResult {
  status: "processed" | "skipped" | "error";
  error?: string;
  originalBytes: number;
  newBytes: number;
  file: string;
}

function isValidImage(file: GCSFile): boolean {
  return (
    !file.name.endsWith("/") &&
    !!file.name.match(/\.(jpg|jpeg|png|gif|tiff|avif)$/i)
  );
}

// eslint-disable-next-line complexity
function shouldSkipImage(file: GCSFile): ProcessResult | null {
  const metaWidth = parseInt(file.metadata.metadata?.width || "0");
  const metaHeight = parseInt(file.metadata.metadata?.height || "0");
  const knownDimensions =
    !isNaN(metaWidth) &&
    metaWidth > 0 &&
    !isNaN(metaHeight) &&
    metaHeight > 0;

  if (!knownDimensions) {
    return null;
  }

  const isTooLargeMetadata =
    metaWidth > MAX_WIDTH_HEIGHT || metaHeight > MAX_WIDTH_HEIGHT;

  if (isTooLargeMetadata) {
    return null;
  }

  const contentType = file.metadata.contentType;
  // Some implementations might store format in custom metadata
  const customFormat = file.metadata.metadata?.format || file.metadata.format;
  const isWebP = contentType === "image/webp" || customFormat === "webp";

  if (isWebP) {
    return {
      status: "skipped",
      originalBytes: parseInt(file.metadata.size || "0"),
      newBytes: 0,
      file: file.name,
    };
  }

  return null;
}

async function processImage(
  file: GCSFile,
  bucket: GCSBucket,
): Promise<ProcessResult> {
  try {
    const skipResult = shouldSkipImage(file);
    if (skipResult) {
      return skipResult;
    }

    const [buffer] = await file.download();
    const originalBytes = buffer.length;

    const image = sharp(buffer);
    const metadata = await image.metadata();

    const isTooLarge =
      (metadata.width && metadata.width > MAX_WIDTH_HEIGHT) ||
      (metadata.height && metadata.height > MAX_WIDTH_HEIGHT);

    if (!isTooLarge && metadata.format === "webp") {
      // Safety skip in case a WebP file slipped through or was mislabeled
      return {
        status: "skipped",
        originalBytes: 0,
        newBytes: 0,
        file: file.name,
      };
    }

    const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    console.log(
      chalk.yellow(
        `[Cron] Processing ${file.name} -> ${newFileName} (Original: ${metadata.width}x${metadata.height}, ${metadata.format})`,
      ),
    );

    const pipeline = isTooLarge
      ? image.resize({
        width: MAX_WIDTH_HEIGHT,
        height: MAX_WIDTH_HEIGHT,
        fit: "inside",
        withoutEnlargement: true,
      })
      : image;

    const convertedBuffer = await pipeline.webp({ quality: 80 }).toBuffer();
    const newBytes = convertedBuffer.length;
    const newMetadata = await sharp(convertedBuffer).metadata();

    const newFile = bucket.file(newFileName);
    // Prepare metadata, filtering out 'name' to avoid conflicts
    const existingMetadata = { ...file.metadata.metadata };
    delete existingMetadata.name;

    const saveOptions = {
      contentType: "image/webp",
      metadata: {
        // Do not spread ...file.metadata directly to avoid name conflict
        metadata: {
          ...existingMetadata,
          width: String(newMetadata.width),
          height: String(newMetadata.height),
          updated: new Date().toISOString(),
        },
        cacheControl: file.metadata.cacheControl,
      },
      resumable: false,
    };

    await newFile.save(convertedBuffer, saveOptions);

    if (newFileName !== file.name) {
      console.log(chalk.cyan(`[Cron] Deleting original file ${file.name}`));
      await file.delete();
    }

    console.log(
      chalk.green(
        `[Cron] Successfully processed ${file.name} (Saved ${(
          (originalBytes - newBytes) /
          1024
        ).toFixed(2)} KB)`,
      ),
    );

    return {
      status: "processed",
      originalBytes,
      newBytes,
      file: file.name,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`[Cron] Error processing ${file.name}:`), error);
    return {
      status: "error",
      error: errorMessage,
      originalBytes: 0,
      newBytes: 0,
      file: file.name,
    };
  }
}

interface GCSStorage {
  bucket(name: string): GCSBucket;
}

import { NextRequest } from "next/server";

export async function GET(_request: NextRequest) {
  console.log(
    chalk.cyan(
      "[Cron] Starting image resizing & WebP conversion job... (VERSION 3)",
    ),
  );
  const startTime = Date.now();

  const bucketName = process.env.GCP_HOMEPAGE_BUCKET ?? DEFAULT_BUCKET_NAME;
  const storage = createStorageClient() as unknown as GCSStorage;
  const bucket = storage.bucket(bucketName);

  try {
    const [files] = await bucket.getFiles();
    console.log(chalk.cyan(`[Cron] Found ${files.length} files in bucket.`));

    const results: ProcessResult[] = [];

    // Concurrency limit to optimize throughput without OOM
    const CONCURRENCY = 5;

    // Process files with concurrency limit
    const queue = [...files];

    // Simple semaphore for concurrency control
    const processNext = async (): Promise<ProcessResult | null> => {
      const file = queue.shift();
      if (!file) return null;

      if (!isValidImage(file)) {
        return {
          status: "skipped",
          file: file.name,
          originalBytes: 0,
          newBytes: 0,
        };
      }

      return processImage(file, bucket);
    };

    const worker = async (): Promise<void> => {
      while (queue.length > 0) {
        const result = await processNext();
        if (result) results.push(result);
      }
    };

    // Start workers
    const workers = new Array(Math.min(files.length, CONCURRENCY))
      .fill(null)
      .map(worker);
    await Promise.all(workers);

    const processed = results.filter((r) => r.status === "processed");
    const errors = results.filter((r) => r.status === "error");
    const skipped = results.length - processed.length - errors.length;

    const totalOriginalBytes = processed.reduce(
      (sum, r) => sum + r.originalBytes,
      0,
    );
    const totalNewBytes = processed.reduce((sum, r) => sum + r.newBytes, 0);
    const totalBytesSaved = totalOriginalBytes - totalNewBytes;

    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const averageReduction =
      totalOriginalBytes > 0
        ? ((totalOriginalBytes - totalNewBytes) / totalOriginalBytes) * 100
        : 0;

    const summary = {
      message: "Job completed",
      processed: processed.length,
      convertedOrResized: processed.length,
      skipped,
      errors: errors.length,
      errorList: errors.map((e) => ({ file: e.file, error: e.error })),
      metrics: {
        durationMs,
        durationSeconds: (durationMs / 1000).toFixed(2),
        totalBytesSaved,
        totalBytesSavedMB: (totalBytesSaved / (1024 * 1024)).toFixed(2),
        averageReductionPercentage: averageReduction.toFixed(2) + "%",
      },
    };

    console.log(chalk.green("[Cron] Job finished."), summary);

    // Send email notification only if there were errors or images processed
    if (processed.length > 0 || errors.length > 0) {
      const { sendEmailToRecipient } = await import("@/services/mailer");
      const emailRecipient =
        process.env.CRON_NOTIFICATION_EMAIL || "anyulled@gmail.com";
      const emailSubject = `[Cron] Image Resizing Job Completed`;
      const emailBody = `
Job Summary:
- Processed: ${summary.processed}
- Resized/Converted: ${summary.convertedOrResized}
- Skipped: ${summary.skipped}
- Errors: ${summary.errors}

Metrics:
- Duration: ${summary.metrics.durationSeconds}s
- Storage Saved: ${summary.metrics.totalBytesSavedMB} MB
- Avg Reduction: ${summary.metrics.averageReductionPercentage}

Errors List:
${summary.errorList.length > 0 ? JSON.stringify(summary.errorList, null, 2) : "None"}
          `;

      await sendEmailToRecipient(emailBody, emailRecipient, emailSubject);
    } else {
      console.log(
        chalk.gray(
          "[Cron] No images processed or errors found. Skipping email notification.",
        ),
      );
    }

    return NextResponse.json(summary, {
      status: summary.errors > 0 ? 500 : 200,
    });
  } catch (error) {
    console.error(chalk.red("[Cron] Fatal error listing files:"), error);
    return NextResponse.json(
      { error: "Failed to process images" },
      { status: 500 },
    );
  }
}
