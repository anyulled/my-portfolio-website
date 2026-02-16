import mapPhotosToGalleryImages from "@/lib/photoMapper";
import { Photo } from "@/types/photos";

describe("mapPhotosToGalleryImages", () => {
  it("should return undefined properties for null input", () => {
    const result = mapPhotosToGalleryImages(null);
    expect(result).toEqual({ galleryPhotos: undefined, lightboxPhotos: undefined });
  });

  it("should return empty arrays for empty input", () => {
    const result = mapPhotosToGalleryImages([]);
    expect(result).toEqual({ galleryPhotos: [], lightboxPhotos: [] });
  });

  it("should correctly map valid photos to gallery and lightbox images", () => {
    const mockPhotos: Photo[] = [
      {
        id: 1,
        title: "Photo 1",
        description: "Description 1",
        width: 1000,
        height: 800,
        dateTaken: new Date(),
        dateUpload: new Date(),
        views: 0,
        tags: "tag1",
        srcSet: [
          {
            src: "image1.jpg",
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
        description: "Description 2",
        width: 1200,
        height: 900,
        dateTaken: new Date(),
        dateUpload: new Date(),
        views: 0,
        tags: "tag2",
        srcSet: [
          {
            src: "image2.jpg",
            width: 1200,
            height: 900,
            title: "Photo 2",
            description: "Description 2",
          },
        ],
      },
    ];

    const result = mapPhotosToGalleryImages(mockPhotos);

    expect(result.galleryPhotos).toHaveLength(2);
    expect(result.lightboxPhotos).toHaveLength(2);

    // Verify Gallery Photos
    expect(result.galleryPhotos?.[0]).toEqual({
      src: "image1.jpg",
      srcSet: mockPhotos[0].srcSet,
      alt: "Photo 1",
      width: 1000,
      height: 800,
    });
    // Gallery photos should NOT have title/description properties (based on current implementation)
    expect(result.galleryPhotos?.[0]).not.toHaveProperty("title");
    expect(result.galleryPhotos?.[0]).not.toHaveProperty("description");

    // Verify Lightbox Photos
    expect(result.lightboxPhotos?.[0]).toEqual({
      src: "image1.jpg",
      srcSet: mockPhotos[0].srcSet,
      alt: "Photo 1",
      width: 1000,
      height: 800,
      title: "Photo 1",
      description: "Description 1",
    });
  });

  it("should handle photos without dimensions using defaults", () => {
    const mockPhoto: Photo = {
      id: 1,
      title: "Photo 1",
      description: "",
      width: 0, // Should trigger default
      height: 0, // Should trigger default
      dateTaken: new Date(),
      dateUpload: new Date(),
      views: 0,
      tags: "",
      srcSet: [{ src: "image.jpg", width: 0, height: 0, title: "", description: "" }],
    };

    const result = mapPhotosToGalleryImages([mockPhoto]);

    // Check defaults (based on current implementation constants)
    // expected defaults are 1200 and 800
    expect(result.galleryPhotos?.[0].width).toBe(1200);
    expect(result.galleryPhotos?.[0].height).toBe(800);
    expect(result.lightboxPhotos?.[0].width).toBe(1200);
    expect(result.lightboxPhotos?.[0].height).toBe(800);
  });
});
