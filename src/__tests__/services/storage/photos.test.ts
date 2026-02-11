/** @jest-environment node */
import { getCachedData, setCachedData } from "@/services/cache";
import { getRedisCachedData, setRedisCachedData } from "@/services/redis";
import { getPhotosFromStorage } from "@/services/storage/photos";
import { Storage } from "@google-cloud/storage";

// Mock dependencies
jest.mock("@/services/redis");
jest.mock("@/services/cache");
jest.mock("@google-cloud/storage");
jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
}));

describe("Photos Storage Service", () => {
  const mockPhoto = {
    id: 1,
    title: "Test Photo",
    width: 800,
    height: 600,
    description: "Test Description",
    dateTaken: new Date(0),
    dateUpload: new Date(0),
    views: 100,
    tags: "test",
    srcSet: [
      {
        src: "https://example.com/photo-large.jpg",
        width: 800,
        height: 600,
        title: "Test Photo",
        description: "Test Description",
      },
    ],
  };

  const mockFile = {
    name: "test-photo.jpg",
    publicUrl: jest.fn().mockReturnValue("https://example.com/photo.jpg"),
    getSignedUrl: jest
      .fn()
      .mockResolvedValue(["https://signed-url.com/photo.jpg"]),
    isPublic: jest.fn().mockResolvedValue([true]),
    metadata: {
      metadata: {
        id: "1",
        title: "Test Photo",
        width: "800",
        height: "600",
      },
    },
  };

  const mockBucket = {
    getFiles: jest.fn().mockResolvedValue([[mockFile]]),
  };

  const mockStorageClient = {
    bucket: jest.fn().mockReturnValue(mockBucket),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Storage as unknown as jest.Mock).mockImplementation(
      () => mockStorageClient,
    );
  });

  it("should return cached data from Redis if available", async () => {
    (getRedisCachedData as jest.Mock).mockResolvedValue([mockPhoto]);

    const result = await getPhotosFromStorage("test-prefix");

    expect(result).toEqual([mockPhoto]);
    expect(getRedisCachedData).toHaveBeenCalled();
    expect(getCachedData).not.toHaveBeenCalled();
    expect(mockStorageClient.bucket).not.toHaveBeenCalled();
  });

  it("should return cached data from Vercel Blob if Redis misses", async () => {
    (getRedisCachedData as jest.Mock).mockResolvedValue(null);
    (getCachedData as jest.Mock).mockResolvedValue([mockPhoto]);

    const result = await getPhotosFromStorage("test-prefix");

    expect(result).toEqual([mockPhoto]);
    expect(getCachedData).toHaveBeenCalled();
    expect(setRedisCachedData).toHaveBeenCalledWith(
      expect.anything(),
      [mockPhoto],
      expect.any(Number),
    );
  });

  it("should fetch from GCS if caches miss", async () => {
    (getRedisCachedData as jest.Mock).mockResolvedValue(null);
    (getCachedData as jest.Mock).mockResolvedValue(null);

    const result = await getPhotosFromStorage("test-prefix");

    expect(result).toHaveLength(1);
    expect(result?.[0].title).toBe("Test Photo");
    expect(mockBucket.getFiles).toHaveBeenCalledWith({
      autoPaginate: false,
      prefix: "test-prefix",
    });
    // Should populate caches
    expect(setRedisCachedData).toHaveBeenCalled();
    expect(setCachedData).toHaveBeenCalled();
  });

  it("should handle GCS errors gracefully", async () => {
    (getRedisCachedData as jest.Mock).mockResolvedValue(null);
    (getCachedData as jest.Mock).mockResolvedValue(null);
    mockBucket.getFiles.mockRejectedValue(new Error("GCS Error"));

    const result = await getPhotosFromStorage("test-prefix");

    expect(result).toBeNull();
  });

  it("should generate hash-based ID for photos without valid metadata ID", async () => {
    (getRedisCachedData as jest.Mock).mockResolvedValue(null);
    (getCachedData as jest.Mock).mockResolvedValue(null);

    const fileWithoutId = {
      ...mockFile,
      name: "photo-without-id.jpg",
      metadata: { metadata: { id: "invalid" } },
    };
    mockBucket.getFiles.mockResolvedValue([[fileWithoutId]]);

    const result = await getPhotosFromStorage("test-prefix");

    // Should not be excluded - instead gets a hash-based ID
    expect(result).toHaveLength(1);
    expect(result?.[0].id).toBeGreaterThan(0);
    expect(result?.[0].title).toBe("photo-without-id.jpg");
  });

  it("should respect limit parameter and process only subset of files", async () => {
    // Mock credentials to ensure getSignedUrl is called
    process.env.GCP_CLIENT_EMAIL = "test@example.com";
    process.env.GCP_PRIVATE_KEY = "test-key";

    (getRedisCachedData as jest.Mock).mockResolvedValue(null);
    (getCachedData as jest.Mock).mockResolvedValue(null);

    const createMockFile = (name: string) => ({
      ...mockFile,
      name,
      getSignedUrl: jest.fn().mockResolvedValue(["https://signed-url.com/" + name]),
      publicUrl: jest.fn().mockReturnValue("https://example.com/" + name),
      isPublic: jest.fn().mockResolvedValue([true]),
    });

    const file1 = createMockFile("photo1.jpg");
    const file2 = createMockFile("photo2.jpg");
    const file3 = createMockFile("photo3.jpg");

    mockBucket.getFiles.mockResolvedValue([[file1, file2, file3]]);

    const result = await getPhotosFromStorage("test-prefix", 2);

    expect(result).toHaveLength(2);
    // Should only process first 2 files
    expect(file1.getSignedUrl).toHaveBeenCalled();
    expect(file2.getSignedUrl).toHaveBeenCalled();
    // Third file should NOT be processed
    expect(file3.getSignedUrl).not.toHaveBeenCalled();

    // Verify limit implementation in GCS (limit + 20 buffer)
    expect(mockBucket.getFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        maxResults: 22,
      }),
    );
  });
});
