/**
 * @jest-environment node
 */
import {
  mapPhotosToGalleryImages,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
} from "@/lib/photoMapper";
import { Photo } from "@/types/photos";

describe("mapPhotosToGalleryImages", () => {
  it("should return undefined for galleryPhotos and lightboxPhotos when input is null", () => {
    const result = mapPhotosToGalleryImages(null);
    expect(result).toEqual({
      galleryPhotos: undefined,
      lightboxPhotos: undefined,
    });
  });

  it("should return empty arrays when input is an empty array", () => {
    const result = mapPhotosToGalleryImages([]);
    expect(result).toEqual({
      galleryPhotos: [],
      lightboxPhotos: [],
    });
  });

  it("should correctly map photos to gallery and lightbox images", () => {
    const mockPhotos: Photo[] = [
      {
        id: 1,
        title: "Photo 1",
        description: "Description 1",
        dateTaken: new Date(),
        dateUpload: new Date(),
        views: 0,
        tags: "",
        width: 100,
        height: 100,
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
        dateTaken: new Date(),
        dateUpload: new Date(),
        views: 0,
        tags: "",
        width: 200,
        height: 200,
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

    // Check first item
    expect(result.galleryPhotos![0]).toEqual({
      src: "image1.jpg",
      srcSet: mockPhotos[0].srcSet,
      alt: "Photo 1",
      width: 100,
      height: 100,
    });

    expect(result.lightboxPhotos![0]).toEqual({
      src: "image1.jpg",
      srcSet: mockPhotos[0].srcSet,
      alt: "Photo 1",
      width: 100,
      height: 100,
      title: "Photo 1",
      description: "Description 1",
    });

    // Check second item
    expect(result.galleryPhotos![1]).toEqual({
      src: "image2.jpg",
      srcSet: mockPhotos[1].srcSet,
      alt: "Photo 2",
      width: 200,
      height: 200,
    });

    expect(result.lightboxPhotos![1]).toEqual({
      src: "image2.jpg",
      srcSet: mockPhotos[1].srcSet,
      alt: "Photo 2",
      width: 200,
      height: 200,
      title: "Photo 2",
      description: "Description 2",
    });
  });

  it("should use default dimensions when width/height are missing", () => {
    const mockPhoto: Photo = {
      id: 3,
      title: "Photo 3",
      description: "Description 3",
      dateTaken: new Date(),
      dateUpload: new Date(),
      views: 0,
      tags: "",
      /* Treating 0 as missing/default based on mapper logic if it checks falsy */
      width: 0,
      height: 0,
      srcSet: [
        {
          src: "image3.jpg",
          width: 0,
          height: 0,
          title: "Photo 3",
          description: "Description 3",
        },
      ],
    };

    const result = mapPhotosToGalleryImages([mockPhoto]);

    expect(result.galleryPhotos![0].width).toBe(DEFAULT_WIDTH);
    expect(result.galleryPhotos![0].height).toBe(DEFAULT_HEIGHT);
  });
});
