import { getPhotosFromStorage } from "@/services/storage/photos";
import { getRedisCachedData, setRedisCachedData } from "@/services/redis";
import { getCachedData, setCachedData } from "@/services/cache";
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
    urlMedium: "https://example.com/photo.jpg",
    width: 800,
    height: 600,
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
});
