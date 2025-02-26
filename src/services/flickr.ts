import chalk from "chalk";
import {FetchTransport, Flickr} from "flickr-sdk";

import {getCachedData, setCachedData} from "@/services/cache";
import * as Sentry from "@sentry/nextjs";

/**
 * Represents a photo.
 * @interface
 */
export interface Photo {
  id: number;
  description: string;
  dateTaken: Date;
  dateUpload: Date;
  height: string;
  title: string;
  urlCrop: string;
  urlLarge: string;
  urlMedium: string;
  urlNormal: string;
  urlSmall: string;
  urlOriginal: string;
  urlThumbnail: string;
  urlZoom: string;
  views: number;
  width: string;
  tags: string;
  srcSet: Array<PhotoSource>;
}

/**
 * Represents a source of a photo.
 * @interface
 */
export interface PhotoSource {
  src: string;
  width: number;
  height: number;
  title: string;
  description: string;
}

/**
 * Represents a photo from Flickr.
 * @typedef {Object} PhotoFlickr
 */
export type PhotoFlickr = {
  datetaken: string;
  dateupload: string;
  description: { _content: string };
  height_c: string;
  height_l: string;
  height_m: string;
  height_n: string;
  height_o: string;
  height_s: string;
  height_t: string;
  height_z: string;
  id: number;
  tags: string;
  title: string;
  url_c: string;
  url_l: string;
  url_m: string;
  url_n: string;
  url_o: string;
  url_s: string;
  url_t: string;
  url_z: string;
  views: string;
  width_c: string;
  width_l: string;
  width_m: string;
  width_n: string;
  width_o: string;
  width_s: string;
  width_t: string;
  width_z: string;
};

const CACHE_EXPIRY = 60 * 60 * 24; // 12 hours

/**
 * Represents the response from Flickr API.
 * @typedef {Object} FlickrResponse
 */
type FlickrResponse = {
  photos: Array<Photo> | null;
  reason: string | null;
  success: boolean;
};

export const fetchTransport = new FetchTransport({
  headers: {
    next: "{ revalidate: 10 }",
  },
});

/**
 * Fetches photos from Flickr based on the provided tags and options.
 * @async
 * @function getFlickrPhotos
 * @param {Flickr} flickr - The Flickr API instance.
 * @param {string} tags - The tags to search for.
 * @param {number} [items=9] - The number of photos to retrieve.
 * @param {boolean} [orderByDate=false] - Whether to order photos by date taken.
 * @param {boolean} [orderByViews=false] - Whether to order photos by views.
 * @returns {Promise<FlickrResponse>} The response containing the fetched photos.
 */
export async function getFlickrPhotos(
  flickr: Flickr,
  tags: string,
  items: number = 9,
  orderByDate: boolean = false,
  orderByViews: boolean = false,
): Promise<FlickrResponse> {
  console.info(
    chalk.blue(
      `Requesting ${chalk.bold(items)} photos from ${chalk.green.italic(tags)} on Flickr...`,
    ),
  );

  let flickrPhotos: Array<PhotoFlickr> | null = null;
  let cachedPhotos: Array<PhotoFlickr> | null = null;
  let errorMessage: string | null = null;

  try {
    const result = await flickr("flickr.photos.search", {
      user_id: "76279599@N00",
      sort: "interestingness-desc",
      safe_search: "3",
      tags: tags,
      tag_mode: "any",
      content_types: "0",
      media: "photos",
      extras:
        "description, url_s, url_m, url_n, url_l, url_z, url_c, url_o, url_t, views, date_upload, date_taken, tags",
    });

    if (result.photos.photo.length !== 0) {
      flickrPhotos = result.photos.photo;
      console.info(
        chalk.blue(
          `Got ${chalk.bold(result.photos.photo.length)} photos from Flickr.`,
        ),
      );

      // Try to update cache with new data
      try {
        console.info(chalk.blue.bold("Update cache with Flickr data."));
        await setCachedData(tags, result.photos.photo, CACHE_EXPIRY);
        console.info(chalk.green.bold("Updated cache with Flickr data."));
      } catch (e) {
        // Just log cache update failure, don't fail the request
        console.error(chalk.red("Failed to update cache.", e));
        Sentry.captureException(e);
      }
    }
  } catch (error) {
    console.error(chalk.red("Failed to fetch from Flickr API:", error));
    Sentry.captureException(error);
    errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch from Flickr API";
  }

  if (!flickrPhotos) {
    try {
      cachedPhotos = await getCachedData(tags);
      if (cachedPhotos) {
        console.info(chalk.blue("Using cached photos."));
      }
    } catch (error) {
      console.error(chalk.red("Failed to get cached data:", error));
      Sentry.captureException(error);
      // Only set error message if we don't have Flickr photos
      if (!flickrPhotos) {
        errorMessage = "Failed to get photos from both Flickr API and cache";
      }
    }
  }

  if (!flickrPhotos && !cachedPhotos) {
    return {
      success: false,
      photos: null,
      reason: errorMessage || "No photos available",
    };
  }

  const photosToProcess = flickrPhotos || cachedPhotos;
  const processedPhotos = processFlickrPhotos(photosToProcess!);

  if (orderByDate) {
    console.info(chalk.cyan("Sorting photos by date taken..."));
    processedPhotos.photos = processedPhotos.photos.toSorted(
      (a: Photo, b: Photo) => b.dateTaken.getTime() - a.dateTaken.getTime(),
    );
  }

  if (orderByViews) {
    console.info(chalk.cyan("Sorting photos by views..."));
    processedPhotos.photos = processedPhotos.photos.toSorted(
      (a: Photo, b: Photo) => b.views - a.views,
    );
  }

  processedPhotos.photos = processedPhotos.photos.slice(0, items);
  return processedPhotos;
}

/**
 * Processes an array of Flickr photos and returns a structured format.
 * @function processFlickrPhotos
 * @param {Array<PhotoFlickr>} photosFlickr - The array of Flickr photos to process.
 * @returns {{ photos: Array<Photo>, reason: null, success: true }} The processed photos.
 */
export function processFlickrPhotos(photosFlickr: Array<PhotoFlickr>): {
  photos: Array<Photo>;
  reason: null;
  success: true;
} {
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

  return {
    photos: photosFlickr.map((photo: PhotoFlickr) => ({
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
    reason: null,
    success: true,
  };
}
