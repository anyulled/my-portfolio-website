import type { Photo } from "@/types/photos";

// Store the mock bucket for test access
let mockBucket: {
    getFiles: jest.Mock;
};

// Mock the GCS Storage module
jest.mock("@google-cloud/storage", () => {
    return {
        Storage: jest.fn().mockImplementation(() => ({
            bucket: jest.fn().mockImplementation(() => mockBucket),
        })),
    };
});

jest.mock("@sentry/nextjs", () => ({
    captureException: jest.fn(),
}));

// Import after mocking
import { GCSPhotoProvider, createGCSPhotoProvider } from "@/services/photos/GCSPhotoProvider";

type MockFile = {
    name: string;
    metadata: {
        updated?: string;
        timeCreated?: string;
    };
    publicUrl: () => string;
    getSignedUrl: jest.Mock;
};

const createMockFile = (
    name: string,
    overrides: Partial<MockFile> = {}
): MockFile => ({
    name,
    metadata: {
        updated: "2025-12-01T19:24:04.154Z",
        timeCreated: "2025-11-01T18:56:28.500Z",
        ...(overrides.metadata ?? {}),
    },
    publicUrl: () => `https://storage.googleapis.com/test-bucket/${name}`,
    getSignedUrl: jest.fn().mockResolvedValue([
        `https://signed.example.com/test-bucket/${name}`,
    ]),
    ...overrides,
});

describe("GCSPhotoProvider", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the mock bucket before each test
        mockBucket = {
            getFiles: jest.fn().mockResolvedValue([[]]),
        };
    });

    describe("construction", () => {
        it("creates provider with default options", () => {
            const provider = createGCSPhotoProvider();
            expect(provider.name).toBe("GCS");
        });

        it("creates provider with custom bucket name", () => {
            const provider = new GCSPhotoProvider({
                bucketName: "custom-bucket",
            });
            expect(provider.name).toBe("GCS");
        });
    });

    describe("listPhotos", () => {
        it("returns empty array when bucket has no files", async () => {
            mockBucket.getFiles.mockResolvedValue([[]]);

            const provider = new GCSPhotoProvider();
            const photos = await provider.listPhotos();

            expect(photos).toEqual([]);
        });

        it("extracts ID and title from filenames", async () => {
            const mockFiles = [
                createMockFile("andrea-cano-montull_54701383010_o.jpg"),
            ];
            mockBucket.getFiles.mockResolvedValue([mockFiles]);

            const provider = new GCSPhotoProvider({ useSignedUrls: false });
            const photos = await provider.listPhotos();

            expect(photos).toHaveLength(1);
            expect(photos![0].id).toBe(54701383010);
            expect(photos![0].title).toBe("Andrea Cano Montull");
        });

        it("filters by prefix", async () => {
            mockBucket.getFiles.mockResolvedValue([[]]);

            const provider = new GCSPhotoProvider();
            await provider.listPhotos({ prefix: "styles/boudoir/" });

            expect(mockBucket.getFiles).toHaveBeenCalledWith({
                prefix: "styles/boudoir/",
                autoPaginate: false,
            });
        });

        it("applies limit to results", async () => {
            const mockFiles = [
                createMockFile("photo1_1_o.jpg"),
                createMockFile("photo2_2_o.jpg"),
                createMockFile("photo3_3_o.jpg"),
                createMockFile("photo4_4_o.jpg"),
                createMockFile("photo5_5_o.jpg"),
            ];
            mockBucket.getFiles.mockResolvedValue([mockFiles]);

            const provider = new GCSPhotoProvider({ useSignedUrls: false });
            const photos = await provider.listPhotos({ limit: 3 });

            expect(photos).toHaveLength(3);
        });

        it("skips files without valid ID in filename", async () => {
            const mockFiles = [
                createMockFile("no-id-here.jpg"),
                createMockFile("valid_123_o.jpg"),
            ];
            mockBucket.getFiles.mockResolvedValue([mockFiles]);

            const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });

            const provider = new GCSPhotoProvider({ useSignedUrls: false });
            const photos = await provider.listPhotos();

            expect(photos).toHaveLength(1);
            expect(photos![0].id).toBe(123);
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining("Could not extract ID")
            );

            warnSpy.mockRestore();
        });

        it("filters out non-image files", async () => {
            const mockFiles = [
                createMockFile("photo_1_o.jpg"),
                createMockFile("document_2_o.pdf"),
                createMockFile("image_3_o.png"),
            ];
            mockBucket.getFiles.mockResolvedValue([mockFiles]);

            const provider = new GCSPhotoProvider({ useSignedUrls: false });
            const photos = await provider.listPhotos();

            expect(photos).toHaveLength(2);
        });

        it("returns null on error", async () => {
            mockBucket.getFiles.mockRejectedValue(new Error("Network error"));

            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => { });

            const provider = new GCSPhotoProvider();
            const photos = await provider.listPhotos();

            expect(photos).toBeNull();

            errorSpy.mockRestore();
        });

        it("sorts by date descending by default", async () => {
            const mockFiles = [
                createMockFile("old_1_o.jpg", { metadata: { updated: "2020-01-01T00:00:00Z" } }),
                createMockFile("new_2_o.jpg", { metadata: { updated: "2025-01-01T00:00:00Z" } }),
                createMockFile("mid_3_o.jpg", { metadata: { updated: "2022-01-01T00:00:00Z" } }),
            ];
            mockBucket.getFiles.mockResolvedValue([mockFiles]);

            const provider = new GCSPhotoProvider({ useSignedUrls: false });
            const photos = await provider.listPhotos({ orderBy: "date", orderDirection: "desc" });

            expect(photos![0].id).toBe(2); // newest
            expect(photos![2].id).toBe(1); // oldest
        });
    });

    describe("getPhoto", () => {
        it("finds photo by numeric ID", async () => {
            const mockFiles = [
                createMockFile("photo1_111_o.jpg"),
                createMockFile("photo2_222_o.jpg"),
                createMockFile("photo3_333_o.jpg"),
            ];
            mockBucket.getFiles.mockResolvedValue([mockFiles]);

            const provider = new GCSPhotoProvider({ useSignedUrls: false });
            const photo = await provider.getPhoto(222);

            expect(photo).not.toBeNull();
            expect(photo!.id).toBe(222);
        });

        it("returns null when photo not found", async () => {
            const mockFiles = [
                createMockFile("photo1_111_o.jpg"),
            ];
            mockBucket.getFiles.mockResolvedValue([mockFiles]);

            const provider = new GCSPhotoProvider({ useSignedUrls: false });
            const photo = await provider.getPhoto(999);

            expect(photo).toBeNull();
        });
    });

    describe("URL handling", () => {
        it("uses public URLs when useSignedUrls is false", async () => {
            const mockFile = createMockFile("test_123_o.jpg");
            mockBucket.getFiles.mockResolvedValue([[mockFile]]);

            const provider = new GCSPhotoProvider({ useSignedUrls: false });
            const photos = await provider.listPhotos();

            expect(mockFile.getSignedUrl).not.toHaveBeenCalled();
            expect(photos![0].urlOriginal).toContain("storage.googleapis.com");
        });

        it("falls back to public URL when signing fails", async () => {
            const mockFile = createMockFile("test_456_o.jpg");
            mockFile.getSignedUrl.mockRejectedValue(new Error("Signing failed"));
            mockBucket.getFiles.mockResolvedValue([[mockFile]]);

            const provider = new GCSPhotoProvider({ useSignedUrls: true });
            const photos = await provider.listPhotos();

            expect(photos![0].urlOriginal).toContain("storage.googleapis.com");
        });
    });
});
