/**
 * @jest-environment node
 */
import { getCachedData } from "@/services/cache";
import { getRedisCachedData, setRedisCachedData } from "@/services/redis";
import { getPhotosFromStorage } from "@/services/storage/photos";
import { Storage } from "@google-cloud/storage";
import { getGCPCredentials, createGCPStorageClient } from "@/lib/gcp/storage-client";

// Mock dependencies
jest.mock("@/services/redis");
jest.mock("@/services/cache");
jest.mock("@google-cloud/storage");
jest.mock("@/lib/gcp/storage-client", () => ({
  getGCPCredentials: jest.fn(),
  createGCPStorageClient: jest.fn(),
}));
jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
}));

describe("Photos Storage Service Optimization", () => {
  const MOCK_FILE_COUNT = 20;
  const REQUEST_LIMIT = 5;

  const mockFile = (index: number) => ({
    name: `test-photo-${index}.jpg`,
    publicUrl: jest.fn().mockReturnValue(`https://example.com/photo-${index}.jpg`),
    getSignedUrl: jest
      .fn()
      .mockResolvedValue([`https://signed-url.com/photo-${index}.jpg`]),
    isPublic: jest.fn().mockResolvedValue([true]),
    metadata: {
      metadata: {
        id: `${index}`,
        title: `Test Photo ${index}`,
        width: "800",
        height: "600",
      },
    },
  });

  const mockFiles = Array.from({ length: MOCK_FILE_COUNT }, (_, i) => mockFile(i));

  const mockBucket = {
    getFiles: jest.fn().mockResolvedValue([mockFiles]),
  };

  const mockStorageClient = {
    bucket: jest.fn().mockReturnValue(mockBucket),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Storage as unknown as jest.Mock).mockImplementation(
      () => mockStorageClient,
    );
    (createGCPStorageClient as jest.Mock).mockReturnValue(mockStorageClient);
    (getGCPCredentials as jest.Mock).mockReturnValue({ hasCredentials: true });
    // Ensure caches miss so we hit GCS
    (getRedisCachedData as jest.Mock).mockResolvedValue(null);
    (getCachedData as jest.Mock).mockResolvedValue(null);
  });

  it("optimized: should only fetch and sign requested number of files", async () => {
    const result = await getPhotosFromStorage("test-prefix", REQUEST_LIMIT);

    if (!result) {
        console.error("Result is null!");
        // Verify mock calls
        console.log("getFiles called:", mockBucket.getFiles.mock.calls.length);
    }

    expect(result).toHaveLength(REQUEST_LIMIT);

    // Check how many files were signed
    let signedCount = 0;
    mockFiles.forEach((file) => {
        if (file.getSignedUrl.mock.calls.length > 0) {
            signedCount++;
        }
    });

    // Optimization: should sign only the requested number of files
    expect(signedCount).toBe(REQUEST_LIMIT);
  });

  it("optimized: should use limit-specific cache key", async () => {
    // 1. First call populates cache
    await getPhotosFromStorage("test-prefix", REQUEST_LIMIT);

    // Check if setRedisCachedData was called with limit key
    const expectedKey = `photos-test-prefix-limit-${REQUEST_LIMIT}`;
    expect(setRedisCachedData).toHaveBeenCalledWith(
        expectedKey,
        expect.anything(),
        expect.any(Number)
    );
  });
});
