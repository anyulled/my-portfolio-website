import { getPhotosFromStorage as getPhotosFromStorageUncached } from "@/services/storage/photos";
import type { Photo } from "@/types/photos";
import { unstable_cache } from "next/cache";

/**
 * Cached version of getPhotosFromStorage using Next.js ISR.
 * Revalidates every 1 week (604800 seconds).
 * 
 * This wrapper ensures photos are cached at the Next.js level,
 * preventing unnecessary GCS calls during static generation.
 *
 * NOTE: We wrap the unstable_cache call inside the function to ensure the cache key
 * includes the dynamic arguments (prefix, limit), preventing collisions.
 */
export const getPhotosFromStorage = async (
    prefix: string,
    limit?: number
): Promise<Photo[] | null> => {
    return unstable_cache(
        async () => {
            return getPhotosFromStorageUncached(prefix, limit);
        },
        // Cache key parts including arguments to prevent collisions
        ["photos-storage", prefix, limit?.toString() ?? "all"],
        {
            // 1 week in seconds
            revalidate: 604800,
            tags: ["photos"],
        }
    )();
};
