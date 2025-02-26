import { list, put } from "@vercel/blob";
import { Photo, PhotoFlickr } from "@/services/flickr";
import chalk from "chalk";

function sanitizeKey(key: string): string {
  return `${key
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 100)}.json`;
}

export async function getCachedData(
  key: string,
): Promise<PhotoFlickr[] | null> {
  const sanitizedKey = sanitizeKey(key);
  const response = await list();
  console.log(chalk.cyan(`Getting Cache for (${sanitizedKey}):`));
  const matchingBlob = response.blobs.find((b) => b.pathname === sanitizedKey);

  if (!matchingBlob) {
    console.warn(chalk.red("Cache miss"));
    return null;
  }
  console.log(chalk.green("Cache hit"), matchingBlob.pathname);

  const res = await fetch(matchingBlob.downloadUrl);
  return await res.json();
}

export async function setCachedData(
  key: string,
  data: Photo[],
  expiryInSeconds: number,
): Promise<void> {
  const sanitizedKey = sanitizeKey(key);
  const serializedData = JSON.stringify(data);
  const result = await put(sanitizedKey, serializedData, {
    contentType: "application/json",
    access: "public",
    cacheControlMaxAge: expiryInSeconds,
    addRandomSuffix: false,
    multipart: false,
  });
  console.log(`Cache Write Success (${sanitizedKey}):`);
  console.log(chalk.cyan("Cache response"), result);
}
