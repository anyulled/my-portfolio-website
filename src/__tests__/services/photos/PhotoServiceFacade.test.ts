// Mock dependencies BEFORE imports
const mockListPhotos = jest.fn();

jest.mock("@/services/photos/GCSPhotoProvider", () => ({
  GCSPhotoProvider: jest.fn().mockImplementation(() => ({
    name: "GCS",
    listPhotos: mockListPhotos,
  })),
}));

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
}));

import {
  PhotoService,
  getPhotoService,
  tagToPrefix,
  tagsToPrefix,
} from "@/services/photos/PhotoServiceFacade";
import type { Photo } from "@/types/photos";

const createMockPhoto = (id: number, tags = ""): Photo => ({
  id,
  title: `Photo ${id}`,
  description: "",
  dateTaken: new Date(),
  dateUpload: new Date(),
  height: 800,
  width: 1200,
  views: 100,
  tags,
  srcSet: [
    {
      src: `https://example.com/${id}/large.jpg`,
      width: 1200,
      height: 800,
      title: `Photo ${id}`,
      description: "",
    },
  ],
});

describe("PhotoServiceFacade", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock function for each test
    mockListPhotos.mockReset();
  });

  describe("tagToPrefix", () => {
    it("converts tag to prefix format", () => {
      expect(tagToPrefix("boudoir")).toBe("boudoir/");
      expect(tagToPrefix("artistic-nude")).toBe("artisticnude/");
      expect(tagToPrefix("Portrait")).toBe("portrait/");
    });
  });

  describe("tagsToPrefix", () => {
    it("returns empty string for empty array", () => {
      expect(tagsToPrefix([])).toBe("");
    });

    it("uses first tag for prefix", () => {
      expect(tagsToPrefix(["boudoir", "lingerie"])).toBe("boudoir/");
    });
  });

  describe("PhotoService", () => {
    describe("fetchPhotos", () => {
      it("returns GCS photos when available", async () => {
        const gcsPhotos = [createMockPhoto(1), createMockPhoto(2)];
        mockListPhotos.mockResolvedValue(gcsPhotos);

        const service = new PhotoService();
        const photos = await service.fetchPhotos({ tag: "boudoir" });

        expect(photos).toEqual(gcsPhotos);
      });

      it("returns empty array when GCS returns no results", async () => {
        mockListPhotos.mockResolvedValue([]);

        const service = new PhotoService();
        const photos = await service.fetchPhotos({ tag: "boudoir" });

        expect(photos).toEqual([]);
      });
    });

    describe("fetchStylePhotos", () => {
      it("uses correct prefix for styles", async () => {
        mockListPhotos.mockResolvedValue([createMockPhoto(1)]);

        const service = new PhotoService();
        await service.fetchStylePhotos("boudoir", 20);

        expect(mockListPhotos).toHaveBeenCalledWith(
          expect.objectContaining({
            prefix: "styles/boudoir/",
          }),
        );
      });
    });

    describe("fetchModelPhotos", () => {
      it("uses correct prefix for models", async () => {
        mockListPhotos.mockResolvedValue([createMockPhoto(1)]);

        const service = new PhotoService();
        await service.fetchModelPhotos("sadie-gray", 20);

        expect(mockListPhotos).toHaveBeenCalledWith(
          expect.objectContaining({
            prefix: "models/sadie-gray/",
          }),
        );
      });
    });

    describe("fetchCoverPhotos", () => {
      it("uses about prefix", async () => {
        mockListPhotos.mockResolvedValue([createMockPhoto(1)]);

        const service = new PhotoService();
        await service.fetchCoverPhotos(10);

        expect(mockListPhotos).toHaveBeenCalledWith(
          expect.objectContaining({
            prefix: "about/",
          }),
        );
      });
    });

    describe("fetchBoudoirPhotos", () => {
      it("uses boudoir prefix", async () => {
        mockListPhotos.mockResolvedValue([createMockPhoto(1)]);

        const service = new PhotoService();
        await service.fetchBoudoirPhotos(10);

        expect(mockListPhotos).toHaveBeenCalledWith(
          expect.objectContaining({
            prefix: "boudoir/",
          }),
        );
      });
    });
  });

  describe("getPhotoService", () => {
    it("returns singleton instance", () => {
      const service1 = getPhotoService();
      const service2 = getPhotoService();

      expect(service1).toBe(service2);
    });
  });
});
