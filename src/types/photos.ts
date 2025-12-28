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
  views: number;
  width: number;
  tags: string;
  srcSet: Array<PhotoSource>;
}
