import { list, put } from "@vercel/blob";
import { Photo } from "@/services/flickr";
import chalk from "chalk";

export async function getCachedData(key: string): Promise<Photo[] | null> {
  const response = await list();
  console.log(chalk.green(`Cache Read Success (${key}):`));
  console.log(chalk.cyan("Cache response"), response);
  const matchingBlob = response.blobs.find((b) => b.pathname === key);

  if (!matchingBlob) {
    return null;
  }
  const res = await fetch(matchingBlob.downloadUrl);
  return await res.json();
}

export async function setCachedData(
  key: string,
  data: Photo[],
  expiryInSeconds: number,
): Promise<void> {
  const serializedData = JSON.stringify(data);
  const result = await put(key, serializedData, {
    contentType: "application/json",
    access: "public",
    cacheControlMaxAge: expiryInSeconds,
  });
  console.log(`Cache Write Success (${key}):`);
  console.log(chalk.cyan("Cache response"), result);
}
