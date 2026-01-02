import { getPhotosFromStorage as getPhotosFromStorageUncached } from "@/services/storage/photos";
import type { Photo } from "@/types/photos";
import { unstable_cache } from "next/cache";

/**
 * Cached version of getPhotosFromStorage using Next.js ISR.
 * Revalidates every 1 week (604800 seconds).
 * 
 * This wrapper ensures photos are cached at the Next.js level,
 * preventing unnecessary GCS calls during static generation.
 */
export const getPhotosFromStorage = unstable_cache(
    async (prefix: string, limit?: number): Promise<Photo[] | null> => {
        return getPhotosFromStorageUncached(prefix, limit);
    },
    ["photos-storage"], // Cache key prefix
    {
        revalidate: 604800, // 1 week in seconds
        tags: ["photos"],
    }
);
