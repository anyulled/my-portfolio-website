import { createFlickr } from "flickr-sdk";

export interface Photo {
  url: string;
  title: string;
  views: number;
  width: string;
  height: string;
  dateUpload: Date;
  dateTaken: Date;
}

export async function getFlickrPhotos(
  tags: string,
  items?: string,
): Promise<{
  reason: string | null;
  success: boolean;
  photos: Array<Photo> | null;
}> {
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!);
  if (!items) {
    items = "9";
  }

  try {
    const value = await flickr("flickr.photos.search", {
      user_id: "76279599@N00",
      sort: "interestingness-desc",
      safe_search: "3",
      tags: tags,
      content_types: "0",
      media: "photos",
      per_page: items,
      extras: "url_s, url_m, url_n, url_l, views, date_upload, date_taken",
    });
    return {
      photos: value.photos.photo
        .map(
          (photo: {
            datetaken: string;
            dateupload: string;
            height_l: string;
            title: string;
            url_l: string;
            url_m: string;
            url_n: string;
            url_s: string;
            views: string;
            width_l: string;
          }) => ({
            urlLarge: photo.url_l,
            urlMedium: photo.url_m,
            urlSmall: photo.url_s,
            urlNormal: photo.url_n,
            title: photo.title,
            views: parseInt(photo.views),
            width: photo.width_l,
            height: photo.height_l,
            dateUpload: new Date(parseInt(photo.dateupload, 10) * 1000),
            dateTaken: new Date(photo.datetaken.replace(" ", "T")),
          }),
        )
        .sort(
          (a: Photo, b: Photo) => a.dateTaken.getTime() - b.dateTaken.getTime(),
        ),
      reason: null,
      success: true,
    };
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
  } finally {
    console.log("Finished");
  }
}
