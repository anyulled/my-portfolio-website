import chalk from "chalk";
import {
  API,
  FetchTransport,
  Flickr,
  FlickrPhotosetsGetPhotosResponse
} from "flickr-sdk";

import { getCachedData, setCachedData } from "@/services/redis";
import * as Sentry from "@sentry/nextjs";
import {
  FlickrResponse,
  Photo,
  PhotoFlickr
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
      "description, url_s, url_m, url_n, url_l, url_z, url_c, url_o, url_t, views, date_upload, date_taken, tags"
  };
};

export const fetchTransport: FetchTransport = new FetchTransport({
  headers: {
    next: "{ revalidate: 10 }"
  }
});

/**
 * Asynchronously fetches photos from the Flickr API based on the provided tags.
 * The function retrieves photos that match the specified included tags and
 * filters out photos that contain any of the excluded tags.
 *
 * @param {Flickr} flickr - Instance of the Flickr API client.
 * @param {string} tags - Comma-separated string of tags to include or exclude.
 *                         Included and excluded tags are separated internally by the function.
 * @returns {Promise<Array<PhotoFlickr> | null>} A promise that resolves to an array of photo objects
 *                                               if photos are found, or null if none match the criteria.
 */
const fetchFlickrPhotos = async (
  flickr: Flickr,
  tags: string
): Promise<Array<PhotoFlickr> | null> => {
  try {
    const { includedTags, excludedTags } = splitTags(tags);
    const result = await flickr(
      "flickr.photos.search",
      createFlickrConfig(includedTags)
    );
    const filteredPhotos = result.photos.photo.filter(
      (photo: PhotoFlickr) => !shouldExcludePhoto(photo, excludedTags)
    );

    return result.photos.photo.length > 0 ? filteredPhotos : null;
  } catch (error) {
    console.error(
      chalk.red(`[ Flickr ] Failed to fetch "${tags}" from Flickr API:`, error)
    );
    Sentry.captureException(error);
    return null;
  }
};

const fetchFlickrPhotosFromAlbum = async (flickr: Flickr, albumId: string) => {
  const result: FlickrPhotosetsGetPhotosResponse = await flickr("flickr.photosets.getPhotos", {
    user_id: "76279599@N00",
    photoset_id: albumId
  });
  return result.photoset.photo;
};

/**
 * Updates the cache with the provided Flickr photos and associated tags.
 *
 * This function asynchronously stores a list of Flickr photos in the cache
 * with the specified tags as the key. The cached data will expire after a
 * predefined duration. If an error occurs during the caching process, it
 * logs the error and reports it to Sentry.
 *
 * @param {string} tags - A string representing the tags associated with the photos.
 * @param {Array<PhotoFlickr>} photos - An array of PhotoFlickr objects to be cached.
 * @returns {Promise<void>} A promise that resolves when the caching process is complete.
 */
const updatePhotoCache = async (
  tags: string,
  photos: Array<PhotoFlickr>
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
 * Fetches photos from a cache based on the provided tags.
 *
 * This asynchronous function attempts to retrieve cached photo data
 * corresponding to the specified tags. If the cache contains data,
 * it returns an array of photos. If the cache is empty or unavailable,
 * it returns null. Any errors encountered in the process are logged
 * and captured for error tracking purposes.
 *
 * @param {string} tags - A string representing the tags to search for in the cache.
 * @returns {Promise<Array<PhotoFlickr> | null>} A promise resolving to an array of
 * photos if cache data is found, or null if no data is available or if an error occurs.
 */
const getPhotosFromCache = async (
  tags: string
): Promise<Array<PhotoFlickr> | null> => {
  try {
    const cachedPhotos = await getCachedData(tags);
    if (cachedPhotos) {
      console.info(chalk.gray("[ Flickr ] Using cached photos."));
      return cachedPhotos;
    }
    return null;
  } catch (error) {
    console.error(chalk.red("[ Flickr ] Failed to get cached data:", error));
    Sentry.captureException(error);
    return null;
  }
};

/**
 * Sorts an array of Photo objects based on specified criteria.
 *
 * @param {Array<Photo>} photos - The array of Photo objects to be sorted.
 * @param {boolean} orderByDate - If true, sorts the photos by the date they were taken, in descending order.
 * @param {boolean} orderByViews - If true, sorts the photos by the number of views, in descending order.
 * @returns {Array<Photo>} - A new array of Photo objects sorted based on the criteria provided.
 */
const sortPhotos = (
  photos: Array<Photo>,
  orderByDate: boolean,
  orderByViews: boolean
): Array<Photo> => {
  let sortedPhotos = [...photos];

  if (orderByDate) {
    console.info(chalk.gray("[ Flickr ] Sorting photos by date taken..."));
    sortedPhotos = sortedPhotos.toSorted(
      (a: Photo, b: Photo) => b.dateTaken.getTime() - a.dateTaken.getTime()
    );
  }

  if (orderByViews) {
    console.info(chalk.gray("[ Flickr ] Sorting photos by views..."));
    sortedPhotos = sortedPhotos.toSorted(
      (a: Photo, b: Photo) => b.views - a.views
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
  reason: message
});

/**
 * Creates a success response
 */
const createSuccessResponse = (photos: Array<Photo>): FlickrResponse => ({
  success: true,
  photos,
  reason: null
});

/**
 * Processes an array of Flickr photo data and transforms it into a structured response.
 *
 * @param {Array<PhotoFlickr>} photosFlickr - An array of photo objects sourced from Flickr's API, each containing metadata such as URLs, dimensions, descriptions, and tags.
 * @returns {FlickrResponse} - A formatted object containing processed photo data with properties including source URLs, sizes, metadata, and other relevant details.
 */
export const processFlickrPhotos = (
  photosFlickr: Array<PhotoFlickr>
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
      heightKey: "height_t"
    },
    small: { urlKey: "url_s", widthKey: "width_s", heightKey: "height_s" },
    medium: { urlKey: "url_m", widthKey: "width_m", heightKey: "height_m" },
    normal: { urlKey: "url_n", widthKey: "width_n", heightKey: "height_n" },
    large: { urlKey: "url_l", widthKey: "width_l", heightKey: "height_l" },
    original: { urlKey: "url_o", widthKey: "width_o", heightKey: "height_o" },
    zoom: { urlKey: "url_z", widthKey: "width_z", heightKey: "height_z" },
    crop: { urlKey: "url_c", widthKey: "width_c", heightKey: "height_c" }
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
          description: photo.description._content
        })
      )
    }))
  );
};

/**
 * Processes and sorts an array of Flickr photos based on specified criteria.
 *
 * @param {Array<PhotoFlickr>} photosFlickr - The array of Flickr photo objects to be processed and sorted.
 * @param {number} items - The maximum number of photos to include in the sorted result.
 * @param {boolean} orderByDate - Determines if the photos should be sorted by date.
 * @param {boolean} orderByViews - Determines if the photos should be sorted by the number of views.
 * @returns {FlickrResponse} The processed and sorted Flickr response containing the photo data.
 */
const processAndSortPhotos = (
  photosFlickr: Array<PhotoFlickr>,
  items: number,
  orderByDate: boolean,
  orderByViews: boolean
): FlickrResponse => {
  const processedPhotos = processFlickrPhotos(photosFlickr);

  if (processedPhotos.photos) {
    processedPhotos.photos = sortPhotos(
      processedPhotos.photos,
      orderByDate,
      orderByViews
    ).slice(0, items);
  }

  return processedPhotos;
};

/**
 * Fetches photos from Flickr based on the provided parameters. It checks the cache first, updates it in the background if necessary, and then retrieves the photos.
 *
 * @param {Flickr} flickr - The Flickr instance used to fetch the photos.
 * @param {string} tags - A string of tags separated by commas to filter the photos.
 * @param {number} [items=9] - The maximum number of photos to retrieve.
 * @param {boolean} [orderByDate=false] - Whether to order the photos by date.
 * @param {boolean} [orderByViews=false] - Whether to order the photos by views.
 * @return {Promise<FlickrResponse>} A promise resolving to the fetched and processed list of Flickr photos or an error response.
 */
export async function getFlickrPhotos(
  flickr: Flickr,
  tags: string,
  items: number = 9,
  orderByDate: boolean = false,
  orderByViews: boolean = false
): Promise<FlickrResponse> {
  const cachedPhotos = await getPhotosFromCache(tags);

  if (cachedPhotos) {
    console.info(
      chalk.gray(
        "[ Flickr ] Returning cached photos while updating in background."
      )
    );

    void (async function updateCacheInBackground() {
      try {
        console.info(
          chalk.gray(
            `[ Flickr ] Requesting ${chalk.bold(items)} photos from ${chalk.green.italic(tags)} on Flickr...`
          )
        );
        const flickrPhotos = await fetchFlickrPhotos(flickr, tags);
        if (flickrPhotos) {
          await updatePhotoCache(tags, flickrPhotos);
        }
      } catch (error) {
        console.error(
          chalk.red("[ Flickr ] Background cache update failed:", error)
        );
        Sentry.captureException(error);
      }
    })();

    return processAndSortPhotos(cachedPhotos, items, orderByDate, orderByViews);
  }

  const flickrPhotos = await fetchFlickrPhotos(flickr, tags);

  if (flickrPhotos) {
    await updatePhotoCache(tags, flickrPhotos);
    return processAndSortPhotos(flickrPhotos, items, orderByDate, orderByViews);
  }

  return createErrorResponse(
    `[ Flickr ] Failed to get photos from both Flickr API and cache for tags: ${tags}`
  );
}

export async function getFlickrPhotosFromAlbum(flickr: Flickr, albumId: string) {
  fetchFlickrPhotosFromAlbum(flickr, albumId)
    .then(photos => {
      if (photos) {
        return processAndSortPhotos(photos, 9, false, false);
      }
      return createErrorResponse("[ Flickr ] Failed to get Album photos from Flickr API");
    });

}

const shouldExcludePhoto = (
  photo: PhotoFlickr,
  excludedTags: string[]
): boolean => {
  if (!excludedTags.length) return false;

  const photoTags = photo.tags.toLowerCase().split(" ");
  return excludedTags.some((excludedTag) =>
    photoTags.includes(excludedTag.toLowerCase())
  );
};

const splitTags = (
  tags: string
): {
  includedTags: string;
  excludedTags: string[];
} => {
  const terms = tags.split(",").map((term) => term.trim());
  return {
    includedTags: terms.filter((term) => !term.startsWith("-")).join(","),
    excludedTags: terms
      .filter((term) => term.startsWith("-"))
      .map((term) => term.slice(1))
  };
};
