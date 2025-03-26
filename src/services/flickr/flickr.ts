import chalk from "chalk";
import {API, FetchTransport, Flickr} from "flickr-sdk";

import {getCachedData, setCachedData} from "@/services/redis";
import * as Sentry from "@sentry/nextjs";
import {
  FlickrResponse,
  Photo,
  PhotoFlickr,
} from "@/services/flickr/flickr.types";

const CACHE_EXPIRY = 60 * 60 * 24; // 24 hours

const createFlickrConfig = (tags: string): API["flickr.photos.search"][0] => {
  return {
    user_id: "76279599@N00",
    sort: "interestingness-desc",
    safe_search: "3",
    tags: tags,
    tag_mode: "any",
    content_types: "0",
    media: "photos",
    extras:
      "description, url_s, url_m, url_n, url_l, url_z, url_c, url_o, url_t, views, date_upload, date_taken, tags",
  };
};

export const fetchTransport: FetchTransport = new FetchTransport({
  headers: {
    next: "{ revalidate: 10 }",
  },
});

/**
 * Fetches photos from Flickr API
 */
const fetchFlickrPhotos = async (
  flickr: Flickr,
  tags: string,
): Promise<Array<PhotoFlickr> | null> => {
  try {
    const { includedTags, excludedTags } = splitTags(tags);
    const result = await flickr(
      "flickr.photos.search",
      createFlickrConfig(includedTags),
    );
    const filteredPhotos = result.photos.photo.filter(
      (photo: PhotoFlickr) => !shouldExcludePhoto(photo, excludedTags),
    );

    return result.photos.photo.length > 0 ? filteredPhotos : null;
  } catch (error) {
    console.error(chalk.red("Failed to fetch from Flickr API:", error));
    Sentry.captureException(error);
    return null;
  }
};

/**
 * Updates cache with new photos
 */
const updatePhotoCache = async (
  tags: string,
  photos: Array<PhotoFlickr>,
): Promise<void> => {
  try {
    console.info(chalk.blue.bold("Updating cache with Flickr data."));
    await setCachedData(tags, photos, CACHE_EXPIRY);
    console.info(chalk.green.bold("Updated cache with Flickr data."));
  } catch (error) {
    console.error(chalk.red("Failed to update cache.", error));
    Sentry.captureException(error);
  }
};

/**
 * Retrieves photos from cache
 */
const getPhotosFromCache = async (
  tags: string,
): Promise<Array<PhotoFlickr> | null> => {
  try {
    const cachedPhotos = await getCachedData(tags);
    if (cachedPhotos) {
      console.info(chalk.blue("Using cached photos."));
      return cachedPhotos;
    }
    return null;
  } catch (error) {
    console.error(chalk.red("Failed to get cached data:", error));
    Sentry.captureException(error);
    return null;
  }
};

/**
 * Sorts photos based on specified criteria
 */
const sortPhotos = (
  photos: Array<Photo>,
  orderByDate: boolean,
  orderByViews: boolean,
): Array<Photo> => {
  let sortedPhotos = [...photos];

  if (orderByDate) {
    console.info(chalk.cyan("Sorting photos by date taken..."));
    sortedPhotos = sortedPhotos.toSorted(
      (a: Photo, b: Photo) => b.dateTaken.getTime() - a.dateTaken.getTime(),
    );
  }

  if (orderByViews) {
    console.info(chalk.cyan("Sorting photos by views..."));
    sortedPhotos = sortedPhotos.toSorted(
      (a: Photo, b: Photo) => b.views - a.views,
    );
  }

  return sortedPhotos;
};

/**
 * Creates a failure response
 */
const createErrorResponse = (message: string): FlickrResponse => ({
  success: false,
  photos: null,
  reason: message,
});

/**
 * Creates a success response
 */
const createSuccessResponse = (photos: Array<Photo>): FlickrResponse => ({
  success: true,
  photos,
  reason: null,
});

export const processFlickrPhotos = (
  photosFlickr: Array<PhotoFlickr>,
): FlickrResponse => {
  const sizeMapping: {
    [key: string]: {
      urlKey: keyof PhotoFlickr;
      widthKey: keyof PhotoFlickr;
      heightKey: keyof PhotoFlickr;
    };
  } = {
    thumbnail: {
      urlKey: "url_t",
      widthKey: "width_t",
      heightKey: "height_t",
    },
    small: { urlKey: "url_s", widthKey: "width_s", heightKey: "height_s" },
    medium: { urlKey: "url_m", widthKey: "width_m", heightKey: "height_m" },
    normal: { urlKey: "url_n", widthKey: "width_n", heightKey: "height_n" },
    large: { urlKey: "url_l", widthKey: "width_l", heightKey: "height_l" },
    original: { urlKey: "url_o", widthKey: "width_o", heightKey: "height_o" },
    zoom: { urlKey: "url_z", widthKey: "width_z", heightKey: "height_z" },
    crop: { urlKey: "url_c", widthKey: "width_c", heightKey: "height_c" },
  };

  return createSuccessResponse(
    photosFlickr.map((photo: PhotoFlickr) => ({
      id: photo.id,
      description: photo.description._content,
      dateTaken: new Date(photo.datetaken.replace(" ", "T")),
      dateUpload: new Date(parseInt(photo.dateupload, 10) * 1000),
      height: photo.height_o,
      tags: photo.tags,
      title: photo.title,
      urlCrop: photo.url_c, //800px
      urlLarge: photo.url_l, //1024px
      urlMedium: photo.url_m, //500px
      urlNormal: photo.url_n, //320px
      urlOriginal: photo.url_o, //original
      urlThumbnail: photo.url_t, //100px
      urlSmall: photo.url_s, //240px
      urlZoom: photo.url_z, //640px
      views: parseInt(photo.views),
      width: photo.width_o,
      srcSet: Object.entries(sizeMapping).map(
        ([, { urlKey, widthKey, heightKey }]) => ({
          src: <string>photo[urlKey],
          width: parseInt(<string>photo[widthKey]),
          height: parseInt(<string>photo[heightKey]),
          title: photo.title,
          description: photo.description._content,
        }),
      ),
    })),
  );
};

/**
 * Fetches photos from Flickr based on the provided tags and options.
 * Returns cached photos immediately if available, and updates cache in the background.
 */

/**
 * Processes and sorts photos from Flickr
 */
const processAndSortPhotos = (
    photosFlickr: Array<PhotoFlickr>,
    items: number,
    orderByDate: boolean,
    orderByViews: boolean,
): FlickrResponse => {
  const processedPhotos = processFlickrPhotos(photosFlickr);

  if (processedPhotos.photos) {
    processedPhotos.photos = sortPhotos(
        processedPhotos.photos,
        orderByDate,
        orderByViews,
    ).slice(0, items);
  }

  return processedPhotos;
};

export async function getFlickrPhotos(
  flickr: Flickr,
  tags: string,
  items: number = 9,
  orderByDate: boolean = false,
  orderByViews: boolean = false,
): Promise<FlickrResponse> {

  const cachedPhotos = await getPhotosFromCache(tags);

  // If we have cached data, trigger Flickr API call in the background and return cached data immediately
  if (cachedPhotos) {
    console.info(chalk.blue("Returning cached photos while updating in background."));

    void (async function updateCacheInBackground() {
      try {
        console.info(
            chalk.blue(
                `Requesting ${chalk.bold(items)} photos from ${chalk.green.italic(tags)} on Flickr...`,
            ),
        );
        const flickrPhotos = await fetchFlickrPhotos(flickr, tags);
        if (flickrPhotos) {
          await updatePhotoCache(tags, flickrPhotos);
        }
      } catch (error) {
        console.error(chalk.red("Background cache update failed:", error));
        Sentry.captureException(error);
      }
    })();

    // Process and return cached photos immediately
    return processAndSortPhotos(cachedPhotos, items, orderByDate, orderByViews);
  }

  // If no cached data, we need to wait for Flickr API call
  const flickrPhotos = await fetchFlickrPhotos(flickr, tags);

  if (flickrPhotos) {
    // Update cache with new photos
    await updatePhotoCache(tags, flickrPhotos);

    // Process and return Flickr photos
    return processAndSortPhotos(flickrPhotos, items, orderByDate, orderByViews);
  }

  // If we reach here, both Flickr API and cache failed
  return createErrorResponse(
     `Failed to get photos from both Flickr API and cache for tags: ${tags}`,
  );
}

const shouldExcludePhoto = (
  photo: PhotoFlickr,
  excludedTags: string[],
): boolean => {
  if (!excludedTags.length) return false;

  const photoTags = photo.tags.toLowerCase().split(" ");
  return excludedTags.some((excludedTag) =>
    photoTags.includes(excludedTag.toLowerCase()),
  );
};

const splitTags = (
  tags: string,
): {
  includedTags: string;
  excludedTags: string[];
} => {
  const terms = tags.split(",").map((term) => term.trim());
  return {
    includedTags: terms.filter((term) => !term.startsWith("-")).join(","),
    excludedTags: terms
      .filter((term) => term.startsWith("-"))
      .map((term) => term.slice(1)), // Remove the '-' prefix
  };
};
