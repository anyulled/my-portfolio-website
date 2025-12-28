import { Redis } from "@upstash/redis";
import chalk from "chalk";
import { sanitizeKey } from "@/lib/sanitizer";

export async function getRedisCachedData<T>(key: string): Promise<T | null> {
  const sanitizedKey = sanitizeKey(key);
  console.log(chalk.cyan(`[Redis] Getting cache for key: ${sanitizedKey}`));

  try {
    const redis = Redis.fromEnv();
    const data = await redis.get<T>(sanitizedKey);

    if (data === null) {
      console.warn(chalk.yellow(`[Redis] Cache miss for key: ${sanitizedKey}`));
      return null;
    }

    console.log(chalk.green(`[Redis] Cache hit for key: ${sanitizedKey}`));
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`[Redis] Error getting cache: ${errorMessage}`));
    return null;
  }
}

export async function setRedisCachedData<T>(
  key: string,
  data: T,
  expiryInSeconds: number,
): Promise<void> {
  const sanitizedKey = sanitizeKey(key);

  try {
    const redis = Redis.fromEnv();
    await redis.set(sanitizedKey, data, {
      ex: expiryInSeconds,
    });
    console.log(
      chalk.green(`[Redis] Cache write success for key: ${sanitizedKey}`),
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`[Redis] Error writing cache: ${errorMessage}`));
  }
}
