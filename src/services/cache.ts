import { list, put } from "@vercel/blob";
import chalk from "chalk";

import { sanitizeKey } from "@/lib/sanitizer";

/**
 * Retrieve cached JSON data for a given cache key from blob storage.
 *
 * @param key - The cache key to look up; it will be sanitized before lookup.
 * @returns The parsed JSON value stored under the sanitized key as type `T`, or `null` if no cache entry exists.
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
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

/**
 * Store a value in Vercel Blob storage under a sanitized key and set its cache lifetime.
 *
 * @param key - The cache key (will be sanitized before storage)
 * @param data - The value to serialize and store as JSON
 * @param expiryInSeconds - Time-to-live in seconds applied to the `cache-control` max-age
 */
export async function setCachedData<T>(
  key: string,
  data: T,
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