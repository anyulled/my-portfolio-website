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

export function getFlickrPhotos(): Promise<{
  success: boolean;
  photos: Array<Photo>;
  reason: string;
}> {
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!);

  return flickr("flickr.photos.search", {
    user_id: "76279599@N00",
    sort: "interestingness-desc",
    safe_search: "3",
    tags: "model, boudoir",
    content_types: "0",
    media: "photos",
    per_page: "9",
    extras: "url_s, url_m, url_n, url_l, views, date_upload, date_taken",
  })
    .then((value) => {
      console.log(value.photos);
      return {
        success: true,
        reason: "",
        photos: value.photos.photo
          .map(
            (photo: {
              datetaken: string;
              dateupload: string;
              height_l: string;
              title: string;
              url_l: string;
              views: string;
              width_l: string;
            }) => ({
              url: photo.url_l,
              title: photo.title,
              views: parseInt(photo.views),
              width: photo.width_l,
              height: photo.height_l,
              dateUpload: new Date(parseInt(photo.dateupload, 10) * 1000),
              dateTaken: new Date(photo.datetaken.replace(" ", "T")),
            }),
          )
          .sort(
            (a: Photo, b: Photo) =>
              a.dateTaken.getTime() - b.dateTaken.getTime(),
          ),
      };
    })
    .catch((reason) => ({
      success: false,
      photos: [],
      reason: reason.message,
    }))
    .finally(() => {
      console.log("Finished");
    });
}
