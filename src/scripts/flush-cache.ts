import { list, del, ListBlobResult } from "@vercel/blob";
import { Redis } from "@upstash/redis";
import chalk from "chalk";

/**
 * Cleanup script to flush cache layers.
 *
 * Usage: npx tsx src/scripts/flush-cache.ts
 */

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
      b.pathname.startsWith("photos-"),
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
