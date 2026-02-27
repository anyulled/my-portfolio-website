import { mapPhotosToGalleryImages } from "@/lib/photoMapper";
import { Photo } from "@/types/photos";

describe("mapPhotosToGalleryImages", () => {
  it("should return undefined for null input", () => {
    const result = mapPhotosToGalleryImages(null);
    expect(result).toEqual({ galleryPhotos: undefined, lightboxPhotos: undefined });
  });

  it("should return empty arrays for empty input array", () => {
    const result = mapPhotosToGalleryImages([]);
    expect(result).toEqual({ galleryPhotos: [], lightboxPhotos: [] });
  });

  it("should correctly map photos to gallery and lightbox images", () => {
    const mockPhotos: Photo[] = [
      {
        id: 1,
        title: "Photo 1",
        description: "Description 1",
        width: 100,
        height: 100,
        dateTaken: new Date(),
        dateUpload: new Date(),
        views: 10,
        tags: "tag1",
        srcSet: [
          {
            src: "image1.jpg",
            width: 100,
            height: 100,
            title: "Photo 1",
            description: "Description 1",
          },
        ],
      },
      {
        id: 2,
        title: "Photo 2",
        description: "Description 2",
        width: 200,
        height: 200,
        dateTaken: new Date(),
        dateUpload: new Date(),
        views: 20,
        tags: "tag2",
        srcSet: [
          {
            src: "image2.jpg",
            width: 200,
            height: 200,
            title: "Photo 2",
            description: "Description 2",
          },
        ],
      },
    ];

    const result = mapPhotosToGalleryImages(mockPhotos);

    expect(result.galleryPhotos).toHaveLength(2);
    expect(result.lightboxPhotos).toHaveLength(2);

    // Check first gallery photo
    expect(result.galleryPhotos![0]).toEqual({
      src: "image1.jpg",
      srcSet: mockPhotos[0].srcSet,
      alt: "Photo 1",
      width: 100,
      height: 100,
    });

    // Check first lightbox photo (should have title and description)
    expect(result.lightboxPhotos![0]).toEqual({
      src: "image1.jpg",
      srcSet: mockPhotos[0].srcSet,
      alt: "Photo 1",
      width: 100,
      height: 100,
      title: "Photo 1",
      description: "Description 1",
    });
  });

  it("should use default dimensions if width/height are missing", () => {
    const mockPhotos: Photo[] = [
      {
        id: 1,
        title: "Photo 1",
        description: "Description 1",
        width: 0,
        height: 0,
        dateTaken: new Date(),
        dateUpload: new Date(),
        views: 10,
        tags: "tag1",
        srcSet: [],
      },
    ];

    /*
     * The current implementation uses `photo.width || DEFAULT_WIDTH`
     * So if width is 0, it uses default.
     */

    const result = mapPhotosToGalleryImages(mockPhotos);

    expect(result.galleryPhotos![0].width).toBe(1200);
    expect(result.galleryPhotos![0].height).toBe(800);
  });
});
