import { Redis } from "@upstash/redis";
import chalk from "chalk";
import { sanitizeKey } from "@/lib/sanitizer";

/**
 * Retrieve a cached value for the given key from Redis.
 *
 * @param key - The cache key to look up (will be sanitized before lookup)
 * @returns The cached value of type `T` if present; `null` if the key is not found or an error occurs
 */
export async function getRedisCachedData<T>(key: string): Promise<T | null> {
  try {
    const redis = Redis.fromEnv();
    const sanitizedKey = sanitizeKey(key);
    console.log(chalk.cyan(`[ Redis ] Getting Cache for (${sanitizedKey}):`));
    const data = await redis.get<T>(sanitizedKey);

    if (data === null) {
      console.warn(chalk.red("[ Redis ] Cache miss"));
      return null;
    }

    console.log(chalk.green("- [ Redis ] Cache hit"));
    return data;
  } catch (error) {
    console.error(chalk.red("[ Redis ] Error getting cache:", error));
    return null;
  }
}

/**
 * Stores a value in Redis under a sanitized key with a specified time-to-live.
 *
 * @param key - The cache key to use; it will be sanitized before storing.
 * @param data - The value to store in the cache.
 * @param expiryInSeconds - Time-to-live for the cached entry, in seconds.
 *
 * Note: errors during the operation are caught and logged; the function does not throw.
 */
export async function setRedisCachedData<T>(
  key: string,
  data: T,
  expiryInSeconds: number,
): Promise<void> {
  try {
    const redis = Redis.fromEnv();
    const sanitizedKey = sanitizeKey(key);
    const result = await redis.set(sanitizedKey, data, {
      ex: expiryInSeconds,
    });
    console.log(`[ Redis ]  Cache Write Success (${sanitizedKey}):`);
    console.log(chalk.cyan("[ Redis ] Cache response"), result);
  } catch (error) {
    console.error(chalk.red("[ Redis ] Error setting cache:", error));
  }
}