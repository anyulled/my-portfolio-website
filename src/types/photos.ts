export interface PhotoSource {
  src: string;
  width: number;
  height: number;
  title: string;
  description: string;
}

export interface Photo {
  id: number;
  description: string;
  dateTaken: Date;
  dateUpload: Date;
  height: number;
  title: string;
  urlCrop: string;
  urlLarge: string;
  urlMedium: string;
  urlNormal: string;
  urlOriginal: string;
  urlThumbnail: string;
  urlSmall: string;
  urlZoom: string;
  views: number;
  width: number;
  tags: string;
  srcSet: Array<PhotoSource>;
}
