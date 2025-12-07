import type { Photo, PhotoSource } from "@/types/photos";

export type { Photo, PhotoSource };

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
export type FlickrResponse = {
  photos: Array<Photo> | null;
  reason: string | null;
  success: boolean;
};
