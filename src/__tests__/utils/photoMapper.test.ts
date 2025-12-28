import { mapPhotosToGalleryImages } from "@/lib/photoMapper";
import { Photo } from "@/types/photos";

const mockPhotos: Photo[] = [
  {
    id: 1,
    description: "desc",
    dateTaken: new Date(),
    dateUpload: new Date(),
    height: 200,
    title: "Title",
    views: 10,
    width: 300,
    tags: "tag1",
    srcSet: [
      {
        src: "large.jpg",
        width: 300,
        height: 200,
        title: "Title",
        description: "desc",
      },
    ],
  },
];

describe("mapPhotosToGalleryImages", () => {
  it("maps photos to gallery and lightbox images", () => {
    const { galleryPhotos, lightboxPhotos } =
      mapPhotosToGalleryImages(mockPhotos);

    expect(galleryPhotos).toHaveLength(1);
    expect(lightboxPhotos).toHaveLength(1);

    expect(galleryPhotos![0].src).toBe("large.jpg");
    expect(lightboxPhotos![0].src).toBe("large.jpg");
  });

  it("handles null input", () => {
    const { galleryPhotos, lightboxPhotos } = mapPhotosToGalleryImages(null);
    expect(galleryPhotos).toBeUndefined();
    expect(lightboxPhotos).toBeUndefined();
  });
});
