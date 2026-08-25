import { getPhotosFromStorage as getPhotosFromStorageUncached } from "@/services/storage/photos";
import type { Photo } from "@/types/photos";
import { cacheLife, cacheTag } from "next/cache";

export const getPhotosFromStorage = async (
  prefix: string,
  limit?: number,
): Promise<Photo[] | null> => {
  "use cache";
  cacheLife({ revalidate: 43200 });
  cacheTag("photos");
  return getPhotosFromStorageUncached(prefix, limit);
};
