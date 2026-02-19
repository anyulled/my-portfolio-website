import mapPhotosToGalleryImages from "@/lib/photoMapper";
import { Photo } from "@/types/photos";

describe("mapPhotosToGalleryImages", () => {
  const mockPhotos: Photo[] = [
    {
      id: 1,
      title: "Test Photo 1",
      description: "Description 1",
      dateTaken: new Date("2023-01-01"),
      dateUpload: new Date("2023-01-02"),
      width: 1000,
      height: 800,
      views: 10,
      tags: "tag1",
      srcSet: [
        {
          src: "image1-large.jpg",
          width: 1000,
          height: 800,
          title: "Test Photo 1",
          description: "Description 1",
        },
        {
          src: "image1-small.jpg",
          width: 500,
          height: 400,
          title: "Test Photo 1",
          description: "Description 1",
        },
      ],
    },
    {
      id: 2,
      title: "Test Photo 2",
      description: "Description 2",
      dateTaken: new Date("2023-02-01"),
      dateUpload: new Date("2023-02-02"),
      width: 1200,
      height: 900,
      views: 20,
      tags: "tag2",
      srcSet: [
        {
          src: "image2-large.jpg",
          width: 1200,
          height: 900,
          title: "Test Photo 2",
          description: "Description 2",
        },
      ],
    },
  ];

  it("should return empty arrays when photos is null", () => {
    const result = mapPhotosToGalleryImages(null);
    expect(result).toEqual({ galleryPhotos: undefined, lightboxPhotos: undefined });
  });

  it("should return empty arrays when photos is empty", () => {
    const result = mapPhotosToGalleryImages([]);
    expect(result.galleryPhotos).toEqual([]);
    expect(result.lightboxPhotos).toEqual([]);
  });

  it("should correctly map photos to gallery and lightbox images", () => {
    const result = mapPhotosToGalleryImages(mockPhotos);

    // Verify galleryPhotos
    expect(result.galleryPhotos).toHaveLength(2);
    expect(result.galleryPhotos![0]).toEqual({
      src: "image1-large.jpg",
      srcSet: mockPhotos[0].srcSet,
      alt: "Test Photo 1",
      width: 1000,
      height: 800,
    });
    expect(result.galleryPhotos![1]).toEqual({
      src: "image2-large.jpg",
      srcSet: mockPhotos[1].srcSet,
      alt: "Test Photo 2",
      width: 1200,
      height: 900,
    });

    // Verify lightboxPhotos
    expect(result.lightboxPhotos).toHaveLength(2);
    expect(result.lightboxPhotos![0]).toEqual({
      src: "image1-large.jpg",
      srcSet: mockPhotos[0].srcSet,
      alt: "Test Photo 1",
      width: 1000,
      height: 800,
      title: "Test Photo 1",
      description: "Description 1",
    });
    expect(result.lightboxPhotos![1]).toEqual({
      src: "image2-large.jpg",
      srcSet: mockPhotos[1].srcSet,
      alt: "Test Photo 2",
      width: 1200,
      height: 900,
      title: "Test Photo 2",
      description: "Description 2",
    });
  });

  it("should handle photos with missing optional fields", () => {
     const incompletePhoto: Photo = {
      id: 3,
      title: "Incomplete Photo",
      description: "",
      dateTaken: new Date(),
      dateUpload: new Date(),
      // Force width/height to be 0 or undefined (though type says number)
      width: 0,
      height: 0,
      views: 0,
      tags: "",
      srcSet: [],
    };

    const result = mapPhotosToGalleryImages([incompletePhoto]);

    // We expect defaults (1200 and 800 based on source code)
    expect(result.galleryPhotos![0].width).toBe(1200);
    expect(result.galleryPhotos![0].height).toBe(800);
    expect(result.galleryPhotos![0].src).toBe("");
  });
});
