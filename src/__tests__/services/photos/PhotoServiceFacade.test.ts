// Mock dependencies BEFORE imports
let mockListPhotos = jest.fn();

jest.mock("@/services/photos/GCSPhotoProvider", () => ({
    GCSPhotoProvider: jest.fn().mockImplementation(() => ({
        name: "GCS",
        listPhotos: mockListPhotos,
    })),
}));

jest.mock("flickr-sdk", () => ({
    createFlickr: jest.fn().mockReturnValue({ flickr: {} }),
}));

jest.mock("@/services/flickr/flickr", () => ({
    getFlickrPhotos: jest.fn(),
}));

jest.mock("@sentry/nextjs", () => ({
    captureException: jest.fn(),
}));

import { PhotoService, getPhotoService, tagToPrefix, tagsToPrefix } from "@/services/photos/PhotoServiceFacade";
import { GCSPhotoProvider } from "@/services/photos/GCSPhotoProvider";
import { getFlickrPhotos } from "@/services/flickr/flickr";
import type { Photo } from "@/types/photos";

const mockGCSProvider = GCSPhotoProvider as jest.MockedClass<typeof GCSPhotoProvider>;
const mockGetFlickrPhotos = getFlickrPhotos as jest.MockedFunction<typeof getFlickrPhotos>;

const createMockPhoto = (id: number, tags = ""): Photo => ({
    id,
    title: `Photo ${id}`,
    description: "",
    dateTaken: new Date(),
    dateUpload: new Date(),
    height: "800",
    width: "1200",
    urlCrop: `https://example.com/${id}/crop.jpg`,
    urlLarge: `https://example.com/${id}/large.jpg`,
    urlMedium: `https://example.com/${id}/medium.jpg`,
    urlNormal: `https://example.com/${id}/normal.jpg`,
    urlOriginal: `https://example.com/${id}/original.jpg`,
    urlSmall: `https://example.com/${id}/small.jpg`,
    urlThumbnail: `https://example.com/${id}/thumb.jpg`,
    urlZoom: `https://example.com/${id}/zoom.jpg`,
    views: 100,
    tags,
    srcSet: [],
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
                expect(mockGetFlickrPhotos).not.toHaveBeenCalled();
            });

            it("falls back to Flickr when GCS returns empty", async () => {
                mockListPhotos.mockResolvedValue([]);
                const flickrPhotos = [createMockPhoto(3), createMockPhoto(4)];
                mockGetFlickrPhotos.mockResolvedValue({
                    success: true,
                    photos: flickrPhotos,
                    reason: null,
                });

                // Set env var for Flickr
                const originalKey = process.env.FLICKR_API_KEY;
                process.env.FLICKR_API_KEY = "test-key";

                const service = new PhotoService();
                const photos = await service.fetchPhotos({ tag: "boudoir" });

                expect(photos).toEqual(flickrPhotos);

                process.env.FLICKR_API_KEY = originalKey;
            });

            it("returns empty array when both fail", async () => {
                mockListPhotos.mockResolvedValue([]);
                mockGetFlickrPhotos.mockResolvedValue({
                    success: false,
                    photos: null,
                    reason: "No results",
                });

                const originalKey = process.env.FLICKR_API_KEY;
                process.env.FLICKR_API_KEY = "test-key";

                const service = new PhotoService();
                const photos = await service.fetchPhotos({ tag: "boudoir" });

                expect(photos).toEqual([]);

                process.env.FLICKR_API_KEY = originalKey;
            });

            it("respects enableFlickrFallback option", async () => {
                mockListPhotos.mockResolvedValue([]);

                const service = new PhotoService({ enableFlickrFallback: false });
                const photos = await service.fetchPhotos({ tag: "boudoir" });

                expect(photos).toEqual([]);
                expect(mockGetFlickrPhotos).not.toHaveBeenCalled();
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
                    })
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
                    })
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
                    })
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
                    })
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
