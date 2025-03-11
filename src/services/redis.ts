import {Redis} from "@upstash/redis";
import chalk from "chalk";
import {PhotoFlickr} from "@/services/flickr/flickr.types";
import {sanitizeKey} from "@/lib/sanitizer";

export async function getCachedData(
    key: string,
): Promise<PhotoFlickr[] | null> {
    const redis = Redis.fromEnv();
    const sanitizedKey = sanitizeKey(key);
    console.log(chalk.cyan(`Getting Cache for (${sanitizedKey}):`));
    const data = redis.get<Array<PhotoFlickr>>(key);

    if (data === null) {
        console.warn(chalk.red("Cache miss"));
        return null;
    }

    console.log(chalk.green("Cache hit"));
    return data;

}

export async function setCachedData(
    key: string,
    data: Array<PhotoFlickr>,
    expiryInSeconds: number,
): Promise<void> {
    const redis = Redis.fromEnv();
    const sanitizedKey = sanitizeKey(key);
    const result = await redis.set(key, JSON.stringify(data), {ex: expiryInSeconds});
    console.log(`Cache Write Success (${sanitizedKey}):`);
    console.log(chalk.cyan("Cache response"), result);
    return;
}