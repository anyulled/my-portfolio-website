/** @jest-environment node */
import { mapPhotosToGalleryImages } from "@/lib/photoMapper";
import { Photo } from "@/types/photos";

describe("mapPhotosToGalleryImages", () => {
  const mockPhotos: Photo[] = [
    {
      id: 1,
      title: "Photo 1",
      width: 1000,
      height: 800,
      description: "Description 1",
      dateTaken: new Date("2023-01-01"),
      dateUpload: new Date("2023-01-01"),
      views: 10,
      tags: "tag1",
      srcSet: [
        {
          src: "https://example.com/photo1.jpg",
          width: 1000,
          height: 800,
          title: "Photo 1",
          description: "Description 1",
        },
      ],
    },
    {
      id: 2,
      title: "Photo 2",
      width: 1200,
      height: 900,
      description: "Description 2",
      dateTaken: new Date("2023-01-02"),
      dateUpload: new Date("2023-01-02"),
      views: 20,
      tags: "tag2",
      srcSet: [
        {
          src: "https://example.com/photo2.jpg",
          width: 1200,
          height: 900,
          title: "Photo 2",
          description: "Description 2",
        },
      ],
    },
  ];

  it("should return undefined if photos is null", () => {
    const result = mapPhotosToGalleryImages(null);
    expect(result).toEqual({ galleryPhotos: undefined, lightboxPhotos: undefined });
  });

  it("should map photos to gallery and lightbox images correctly", () => {
    const result = mapPhotosToGalleryImages(mockPhotos);

    expect(result.galleryPhotos).toHaveLength(2);
    expect(result.lightboxPhotos).toHaveLength(2);

    expect(result.galleryPhotos![0]).toEqual({
      src: "https://example.com/photo1.jpg",
      srcSet: mockPhotos[0].srcSet,
      alt: "Photo 1",
      width: 1000,
      height: 800,
    });

    expect(result.lightboxPhotos![0]).toEqual({
      src: "https://example.com/photo1.jpg",
      srcSet: mockPhotos[0].srcSet,
      alt: "Photo 1",
      width: 1000,
      height: 800,
      title: "Photo 1",
      description: "Description 1",
    });

    expect(result.galleryPhotos![1]).toEqual({
      src: "https://example.com/photo2.jpg",
      srcSet: mockPhotos[1].srcSet,
      alt: "Photo 2",
      width: 1200,
      height: 900,
    });
  });

  it("should handle empty photos array", () => {
    const result = mapPhotosToGalleryImages([]);
    expect(result.galleryPhotos).toEqual([]);
    expect(result.lightboxPhotos).toEqual([]);
  });
});
