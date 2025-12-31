import {
  createStorageClient,
  DEFAULT_BUCKET_NAME,
} from "@/services/storage/photos";
import chalk from "chalk";
import { NextResponse } from "next/server";
import sharp from "sharp";

export const maxDuration = 300; // 5 minutes
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
    !!file.name.match(/\.(jpg|jpeg|png|webp|gif|tiff|avif)$/i)
  );
}

async function processImage(
  file: GCSFile,
  bucket: GCSBucket,
): Promise<ProcessResult> {
  try {
    const [buffer] = await file.download();
    const originalBytes = buffer.length;

    const image = sharp(buffer);
    const metadata = await image.metadata();

    const isWebP = metadata.format === "webp";
    const isTooLarge =
      (metadata.width && metadata.width > MAX_WIDTH_HEIGHT) ||
      (metadata.height && metadata.height > MAX_WIDTH_HEIGHT);

    if (isWebP && !isTooLarge) {
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

    let pipeline = image;
    if (isTooLarge) {
      pipeline = pipeline.resize({
        width: MAX_WIDTH_HEIGHT,
        height: MAX_WIDTH_HEIGHT,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    const convertedBuffer = await pipeline.webp({ quality: 80 }).toBuffer();
    const newBytes = convertedBuffer.length;
    const newMetadata = await sharp(convertedBuffer).metadata();

    const newFile = bucket.file(newFileName);
    await newFile.save(convertedBuffer, {
      contentType: "image/webp",
      metadata: {
        ...file.metadata,
        metadata: {
          ...file.metadata.metadata,
          width: String(newMetadata.width),
          height: String(newMetadata.height),
          updated: new Date().toISOString(),
        },
      },
      resumable: false,
    });

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

export async function GET() {
  console.log(
    chalk.cyan("[Cron] Starting image resizing & WebP conversion job..."),
  );
  const startTime = Date.now();

  const bucketName = process.env.GCP_HOMEPAGE_BUCKET ?? DEFAULT_BUCKET_NAME;
  const storage = createStorageClient();
  // Cast to our interface to enforce usage structure
  const bucket = storage.bucket(bucketName) as unknown as GCSBucket;

  try {
    const [files] = await bucket.getFiles();
    console.log(chalk.cyan(`[Cron] Found ${files.length} files in bucket.`));

    const results: ProcessResult[] = [];

    for (const file of files) {
      if (!isValidImage(file)) continue;
      const result = await processImage(file, bucket);
      results.push(result);
    }

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

    // Send email notification
    /* eslint-disable-next-line @typescript-eslint/no-require-imports */
    const { sendEmailToRecipient } = require("@/services/mailer");
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

    return NextResponse.json(summary);
  } catch (error) {
    console.error(chalk.red("[Cron] Fatal error listing files:"), error);
    return NextResponse.json(
      { error: "Failed to process images" },
      { status: 500 },
    );
  }
}
