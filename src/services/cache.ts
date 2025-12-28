import { list, put } from "@vercel/blob";
import chalk from "chalk";

import { sanitizeKey } from "@/lib/sanitizer";

export async function getCachedData<T>(key: string): Promise<T | null> {
  const sanitizedKey = sanitizeKey(key);
  console.log(
    chalk.cyan(`[VercelBlob] Getting cache for key: ${sanitizedKey}`),
  );

  try {
    const response = await list();
    const matchingBlob = response.blobs.find(
      (b) => b.pathname === sanitizedKey,
    );

    if (!matchingBlob) {
      console.warn(
        chalk.yellow(`[VercelBlob] Cache miss for key: ${sanitizedKey}`),
      );
      return null;
    }
    console.log(chalk.green(`[VercelBlob] Cache hit for key: ${sanitizedKey}`));

    const res = await fetch(matchingBlob.downloadUrl);
    return await res.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      chalk.red(`[VercelBlob] Error getting cache: ${errorMessage}`),
    );
    return null;
  }
}

export async function setCachedData<T>(
  key: string,
  data: T,
  expiryInSeconds: number,
): Promise<void> {
  const sanitizedKey = sanitizeKey(key);

  try {
    const serializedData = JSON.stringify(data);
    const result = await put(sanitizedKey, serializedData, {
      contentType: "application/json",
      access: "public",
      cacheControlMaxAge: expiryInSeconds,
      addRandomSuffix: false,
      multipart: false,
    });
    console.log(
      chalk.green(`[VercelBlob] Cache write success for key: ${sanitizedKey}`),
    );
    console.log(chalk.cyan(`[VercelBlob] Blob URL: ${result.url}`));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      chalk.red(
        `[VercelBlob] Error writing cache for key ${sanitizedKey}: ${errorMessage}`,
      ),
    );
  }
}
