/* eslint-disable no-restricted-syntax, security/detect-non-literal-fs-filename, security/detect-object-injection */
import fs from "node:fs";
import path from "node:path";
import { list, del, ListBlobResult } from "@vercel/blob";
import { Redis } from "@upstash/redis";
import chalk from "chalk";

/**
 * Simple .env loader to ensure local execution has access to secrets.
 * Next.js does this automatically, but standalone scripts need it.
 */
const loadEnv = () => {
  const envFiles = [".env.local", ".env"];

  envFiles.forEach((file) => {
    const filePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    content.split("\n").forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#")) return;

      const [key, ...valueParts] = trimmedLine.split("=");
      const keyTrimmed = key?.trim();
      if (!keyTrimmed) return;

      let value = valueParts.join("=").trim();
      // Remove surrounding quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!(keyTrimmed in process.env)) {
        process.env[keyTrimmed] = value;
      }
    });
  });
};

loadEnv();

const flushRedis = async (): Promise<void> => {
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;

  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    console.warn(
      chalk.yellow("⚠️ Redis credentials missing. Skipping Redis flush."),
    );
    return;
  }

  const redis = new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    const keys = await redis.keys("photos-*");
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(chalk.green(`✅ Redis: deleted ${keys.length} keys.`));
    } else {
      console.log(chalk.green("✅ Redis: no 'photos-*' keys to delete."));
    }
  } catch (error) {
    console.error(chalk.red("❌ Redis flush failed:"), error);
  }
};

const flushVercelBlob = async (
  cursor?: string,
  deletedCount = 0,
): Promise<number> => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn(
      chalk.yellow("⚠️ Vercel Blob token missing. Skipping Blob flush."),
    );
    return 0;
  }

  try {
    const result: ListBlobResult = await list({ cursor, limit: 100 });
    const photoBlobs = result.blobs.filter((b) =>
      b.pathname.startsWith("photos"),
    );

    if (photoBlobs.length > 0) {
      await del(photoBlobs.map((b) => b.url));
    }

    const currentDeletedCount = deletedCount + photoBlobs.length;

    if (result.hasMore && result.cursor) {
      return await flushVercelBlob(result.cursor, currentDeletedCount);
    }

    return currentDeletedCount;
  } catch (error) {
    console.error(chalk.red("❌ Vercel Blob flush failed:"), error);
    return deletedCount;
  }
};

const main = async (): Promise<void> => {
  console.log(chalk.cyan("🚀 Starting cache flush..."));
  await flushRedis();
  const totalDeleted = await flushVercelBlob();
  if (totalDeleted > 0) {
    console.log(chalk.green(`✅ Vercel Blob: deleted ${totalDeleted} blobs.`));
  }
  console.log(chalk.cyan("✨ Cache flush complete."));
};

main().catch((err) => {
  console.error(chalk.red("💥 Fatal error:"), err);
  process.exit(1);
});
/* eslint-enable no-restricted-syntax, security/detect-non-literal-fs-filename, security/detect-object-injection */
