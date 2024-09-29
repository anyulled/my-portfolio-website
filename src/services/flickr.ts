import { createFlickr } from "flickr-sdk";

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
  id: number;
  description: { _content: string };
  datetaken: string;
  dateupload: string;
  height_l: string;
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
  width_l: string;
};

export async function getFlickrPhotos(
  tags: string,
  items: number = 9,
  orderByDate: boolean = false,
): Promise<{
  reason: string | null;
  success: boolean;
  photos: Array<Photo> | null;
}> {
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!);

  console.info(`Getting ${items} photos from ${tags} on Flickr...`);

  try {
    const value = await flickr("flickr.photos.search", {
      user_id: "76279599@N00",
      sort: "interestingness-desc",
      safe_search: "3",
      tags: tags,
      content_types: "0",
      media: "photos",
      per_page: items.toString(),
      extras:
        "description, url_s, url_m, url_n, url_l, url_z, url_c, url_o, url_t, views, date_upload, date_taken",
    });

    console.info(`Got ${value.photos.photo.length} photos from Flickr.`);
    let photos = {
      photos: value.photos.photo.map((photo: PhotoFlickr) => ({
        id: photo.id,
        description: photo.description._content,
        dateTaken: new Date(photo.datetaken.replace(" ", "T")),
        dateUpload: new Date(parseInt(photo.dateupload, 10) * 1000),
        height: photo.height_l,
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
        width: photo.width_l,
      })),
      reason: null,
      success: true,
    };
    if (orderByDate) {
      photos = photos.photos.sort(
        (a: Photo, b: Photo) => b.dateTaken.getTime() - a.dateTaken.getTime(),
      );
    }
    return photos;
  } catch (reason) {
    if (reason instanceof Error) {
      return {
        success: false,
        photos: null,
        reason: reason.message,
      };
    } else {
      return {
        success: false,
        photos: null,
        reason: "Unknown error",
      };
    }
  }
}
