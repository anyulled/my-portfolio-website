import chalk from "chalk";
import { Flickr } from "flickr-sdk";

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
}

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

export class NoPhotosFoundError extends Error {
  constructor() {
    super("No photos found");
    this.name = "NoPhotosFoundError";
  }
}

type FlickrResponse = {
  photos: Array<Photo> | null;
  reason: string | null;
  success: boolean;
};

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
        "description, url_s, url_m, url_n, url_l, url_z, url_c, url_o, url_t, views, date_upload, date_taken",
    });

    console.info(
      chalk.blue(
        `Got ${chalk.bold(result.photos.photo.length)} photos from Flickr.`,
      ),
    );

    if (result.photos.photo.length === 0) {
      console.error(chalk.red.bold("No photos found."));
    }
    console.log(result.photos.photo);

    const photos = processFlickrPhotos(result.photos.photo);

    if (orderByDate) {
      console.info(chalk.cyan("Sorting photos by date taken..."));
      photos.photos = photos.photos.sort(
        (a: Photo, b: Photo) => b.dateTaken.getTime() - a.dateTaken.getTime(),
      );
    }

    if (orderByViews) {
      console.info(chalk.cyan("Sorting photos by views..."));
      photos.photos = photos.photos.sort(
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

export function processFlickrPhotos(photosFlickr: Array<PhotoFlickr>): {
  photos: Array<Photo>;
  reason: null;
  success: true;
} {
  return {
    photos: photosFlickr.map((photo: PhotoFlickr) => ({
      id: photo.id,
      description: photo.description._content,
      dateTaken: new Date(photo.datetaken.replace(" ", "T")),
      dateUpload: new Date(parseInt(photo.dateupload, 10) * 1000),
      height: photo.height_o,
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
    })),
    reason: null,
    success: true,
  };
}
