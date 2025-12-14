import { Redis } from "@upstash/redis";
import chalk from "chalk";
import type { Photo } from "@/types/photos";
import { sanitizeKey } from "@/lib/sanitizer";

export interface CachedPhoto extends Photo {
  expiresAt: number;
}

export async function getCachedData(
  key: string,
): Promise<CachedPhoto[] | null> {
  const redis = Redis.fromEnv();
  const sanitizedKey = sanitizeKey(key);
  console.log(chalk.cyan(`[ Redis ] Getting Cache for (${sanitizedKey}):`));
  const expiryDate = await redis.ttl(sanitizedKey);
  const data = await redis.get<Array<Photo>>(sanitizedKey);

  if (data === null) {
    console.warn(chalk.red("[ Redis ] Cache miss"));
    return null;
  }

  console.log(chalk.green("- [ Redis ] Cache hit", data.length));
  return data.map((photo) => ({
    ...photo,
    expiresAt: expiryDate,
  }));
}

export async function setCachedData(
  key: string,
  data: Array<Photo>,
  expiryInSeconds: number,
): Promise<void> {
  const redis = Redis.fromEnv();
  const sanitizedKey = sanitizeKey(key);
  const result = await redis.set(sanitizedKey, JSON.stringify(data), {
    ex: expiryInSeconds,
  });
  console.log(`[ Redis ]  Cache Write Success (${sanitizedKey}):`);
  console.log(chalk.cyan("[ Redis ] Cache response"), result);
  return;
}
