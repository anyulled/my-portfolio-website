/** @jest-environment @stryker-mutator/jest-runner/jest-env/node */
import { getRedisCachedData, setRedisCachedData } from "@/services/redis";
import { getPhotosFromStorage } from "@/services/storage/photos";
import { Storage } from "@google-cloud/storage";

// Mock dependencies
jest.mock("@/services/redis");
jest.mock("@google-cloud/storage");
jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
}));

describe("Photos Storage Service", () => {
  const originalHarnessMode = process.env.HARNESS_MODE;
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

  afterEach(() => {
    if (originalHarnessMode === undefined) {
      delete process.env.HARNESS_MODE;
      return;
    }

    process.env.HARNESS_MODE = originalHarnessMode;
  });

  it("returns local fixture photos without accessing integrations", async () => {
    process.env.HARNESS_MODE = "fixture";

    const result = await getPhotosFromStorage("hero", 1);

    expect(result?.[0].srcSet[0].src).toBe("/images/DSC_7028.jpg");
    expect(getRedisCachedData).not.toHaveBeenCalled();
    expect(mockStorageClient.bucket).not.toHaveBeenCalled();
  });

  it("should return cached data from Redis if available", async () => {
    (getRedisCachedData as jest.Mock).mockResolvedValue([mockPhoto]);

    const result = await getPhotosFromStorage("test-prefix");

    expect(result).toEqual([mockPhoto]);
    expect(getRedisCachedData).toHaveBeenCalled();
    expect(mockStorageClient.bucket).not.toHaveBeenCalled();
  });

  it("should fetch from GCS and populate Redis if Redis misses", async () => {
    (getRedisCachedData as jest.Mock).mockResolvedValue(null);

    const result = await getPhotosFromStorage("test-prefix");

    expect(result).toEqual([
      expect.objectContaining({
        id: mockPhoto.id,
        title: mockPhoto.title,
      }),
    ]);
    expect(mockStorageClient.bucket).toHaveBeenCalledWith(
      "sensuelle-boudoir-homepage",
    );
    expect(setRedisCachedData).toHaveBeenCalledWith(
      "photos-test-prefix",
      expect.any(Array),
      43_200,
    );
  });

  it("should return GCS photos when Redis cannot store them", async () => {
    (getRedisCachedData as jest.Mock).mockResolvedValue(null);
    (setRedisCachedData as jest.Mock).mockRejectedValueOnce(
      new Error("Redis write error"),
    );

    const result = await getPhotosFromStorage("test-prefix");

    expect(result).toEqual([
      expect.objectContaining({
        id: mockPhoto.id,
        title: mockPhoto.title,
      }),
    ]);
    expect(setRedisCachedData).toHaveBeenCalledWith(
      "photos-test-prefix",
      expect.any(Array),
      43_200,
    );
  });

  it("should fetch from GCS when Redis lookup fails", async () => {
    (getRedisCachedData as jest.Mock).mockRejectedValueOnce(
      new Error("Redis read error"),
    );

    const result = await getPhotosFromStorage("test-prefix");

    expect(result).toEqual([
      expect.objectContaining({
        id: mockPhoto.id,
        title: mockPhoto.title,
      }),
    ]);
    expect(setRedisCachedData).toHaveBeenCalledWith(
      "photos-test-prefix",
      expect.any(Array),
      43_200,
    );
  });

  it("should fetch from GCS if Redis misses", async () => {
    (getRedisCachedData as jest.Mock).mockResolvedValue(null);

    const result = await getPhotosFromStorage("test-prefix");

    expect(result).toHaveLength(1);
    expect(result?.[0].title).toBe("Test Photo");
    expect(result?.[0].srcSet[0].src).toBe("https://example.com/photo.jpg");
    expect(mockBucket.getFiles).toHaveBeenCalledWith({
      autoPaginate: false,
      prefix: "test-prefix",
    });
    expect(setRedisCachedData).toHaveBeenCalledTimes(1);
  });

  it("should handle GCS errors gracefully", async () => {
    (getRedisCachedData as jest.Mock).mockResolvedValue(null);
    mockBucket.getFiles.mockRejectedValue(new Error("GCS Error"));

    const result = await getPhotosFromStorage("test-prefix");

    expect(result).toBeNull();
  });

  it("should generate hash-based ID for photos without valid metadata ID", async () => {
    (getRedisCachedData as jest.Mock).mockResolvedValue(null);

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
    (getRedisCachedData as jest.Mock).mockResolvedValue(null);

    const createMockFile = (name: string) => ({
      ...mockFile,
      name,
      getSignedUrl: jest
        .fn()
        .mockResolvedValue(["https://signed-url.com/" + name]),
      publicUrl: jest.fn().mockReturnValue("https://example.com/" + name),
      isPublic: jest.fn().mockResolvedValue([true]),
    });

    const file1 = createMockFile("photo1.jpg");
    const file2 = createMockFile("photo2.jpg");
    const file3 = createMockFile("photo3.jpg");

    mockBucket.getFiles.mockResolvedValue([[file1, file2, file3]]);

    const result = await getPhotosFromStorage("test-prefix", 2);

    expect(result).toHaveLength(2);
    expect(file1.publicUrl).toHaveBeenCalled();
    expect(file2.publicUrl).toHaveBeenCalled();
    expect(file3.publicUrl).not.toHaveBeenCalled();

    expect(mockBucket.getFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        maxResults: 22,
      }),
    );
  });
});
