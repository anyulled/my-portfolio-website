/* eslint-disable no-restricted-syntax, security/detect-non-literal-fs-filename, security/detect-object-injection */
import fs from "node:fs";
import path from "node:path";
import { list, del, ListBlobResult } from "@vercel/blob";
import { Redis } from "@upstash/redis";
import chalk from "chalk";

/**
 * Robust .env loader to handle local execution.
 */
const loadEnv = () => {
  const envFiles = [".env.local", ".env"];

  envFiles.forEach((file) => {
    const filePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) return;

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      content.split(/\r?\n/).forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith("#")) return;

        const match = trimmedLine.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || "";

          // Remove surrounding quotes
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }

          if (!(key in process.env)) {
            process.env[key] = value;
          }
        }
      });
    } catch (e) {
      console.warn(`Failed to read ${file}:`, e);
    }
  });
};

loadEnv();

const flushRedis = async (): Promise<void> => {
  // Try multiple common names for the same thing
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.REDIS_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    console.warn(
      chalk.yellow(
        "⚠️ Redis credentials missing (tried UPSTASH_REDIS_REST_URL, KV_REST_API_URL, REDIS_URL). Skipping Redis flush.",
      ),
    );
    return;
  }

  const redis = new Redis({
    url,
    token,
  });

  try {
    // Try both with and without sanitization matching
    const keys = await redis.keys("photos*");
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(
        chalk.green(
          `✅ Redis: deleted ${keys.length} keys starting with 'photos'.`,
        ),
      );
    } else {
      console.log(chalk.green("✅ Redis: no 'photos*' keys found."));
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
    // Match sanitized keys (no dashes) and original keys
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
