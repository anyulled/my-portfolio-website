import { Redis } from "@upstash/redis";
import chalk from "chalk";
import { sanitizeKey } from "@/lib/sanitizer";

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
