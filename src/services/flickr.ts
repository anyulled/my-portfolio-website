import chalk from "chalk";
import {Flickr} from "flickr-sdk";

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
type PhotoFlickr = {
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

/**
 * Error thrown when no photos are found.
 * @class
 * @extends Error
 */
export class NoPhotosFoundError extends Error {
  constructor() {
    super("No photos found");
    this.name = "NoPhotosFoundError";
  }
}

/**
 * Represents the response from Flickr API.
 * @typedef {Object} FlickrResponse
 */
type FlickrResponse = {
  photos: Array<Photo> | null;
  reason: string | null;
  success: boolean;
};


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

  try {
    const result = await flickr("flickr.photos.search", {
      user_id: "76279599@N00",
      sort: "interestingness-desc",
      safe_search: "3",
      tags: tags,
      content_types: "0",
      media: "photos",
      extras:
        "description, url_s, url_m, url_n, url_l, url_z, url_c, url_o, url_t, views, date_upload, date_taken, tags",
    });

    console.info(
      chalk.blue(
        `Got ${chalk.bold(result.photos.photo.length)} photos from Flickr.`,
      ),
    );

    if (result.photos.photo.length === 0) {
      console.error(chalk.red.bold("No photos found."));
      return Promise.reject(new NoPhotosFoundError());
    }

    const photos = processFlickrPhotos(result.photos.photo);

    if (orderByDate) {
      console.info(chalk.cyan("Sorting photos by date taken..."));
      photos.photos = photos.photos.toSorted(
        (a: Photo, b: Photo) => b.dateTaken.getTime() - a.dateTaken.getTime(),
      );
    }

    if (orderByViews) {
      console.info(chalk.cyan("Sorting photos by views..."));
      photos.photos = photos.photos.toSorted(
        (a: Photo, b: Photo) => b.views - a.views,
      );
    }

    photos.photos = photos.photos.slice(0, items);
    return photos;
  } catch (reason) {
    const errorMessage =
      reason instanceof Error ? reason.message : "Unknown error";
    return {
      success: false,
      photos: null,
      reason: errorMessage,
    };
  }
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
    thumbnail: { urlKey: "url_t", widthKey: "width_t", heightKey: "height_t" },
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
