import { sanitizeKey } from "@/lib/sanitizer";
import { getCachedData, setCachedData } from "@/services/cache";
import { Photo } from "@/types/photos";
// Import the mocked functions after mocking
import { del, list, put } from "@vercel/blob";

// Mock the dependencies
jest.mock("@vercel/blob", () => ({
  del: jest.fn(),
  list: jest.fn(),
  put: jest.fn(),
}));
jest.mock("@/lib/sanitizer");

describe("Cache Service", () => {
  // Mock data
  const mockKey = "test-key";
  const mockSanitizedKey = "test_key";
  const mockPhotos: Photo[] = [
    {
      id: 123,
      title: "Test Photo",
      description: "Test Description",
      dateTaken: new Date("2023-01-01T12:00:00Z"),
      dateUpload: new Date(1672531200 * 1000),
      tags: "test",
      views: 100,
      width: 1024,
      height: 768,
      srcSet: [
        {
          src: "http://example.com/large.jpg",
          width: 1024,
          height: 768,
          title: "Test Photo",
          description: "Test Description",
        },
      ],
    },
  ];

  // Mock Vercel Blob response
  const mockBlob = {
    pathname: mockSanitizedKey,
    url: "https://example.com/blob",
    downloadUrl: "https://example.com/download",
    contentType: "application/json",
    contentLength: 1000,
    uploadedAt: new Date().toISOString(),
  };

  // Mock put response
  const mockPutResponse = {
    url: "https://example.com/upload",
    pathname: mockSanitizedKey,
  };

  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();

    // Mock sanitizeKey to return a predictable value
    (sanitizeKey as jest.Mock).mockReturnValue(mockSanitizedKey);

    // Mock global fetch
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            data: mockPhotos,
            expiresAt: Date.now() + 3600 * 1000,
          }),
      }),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("getCachedData", () => {
    it("should return cached data when available", async () => {
      // Mock list to return a blob that matches our key
      (list as jest.Mock).mockResolvedValue({
        blobs: [mockBlob],
      });

      // Call the function
      const result = await getCachedData(mockKey);

      // Check that list was called
      expect(list).toHaveBeenCalledWith({ prefix: mockSanitizedKey });

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

      // Check that fetch was called with the correct URL
      expect(global.fetch).toHaveBeenCalledWith(mockBlob.downloadUrl);

      // Check the result
      expect(result).toEqual(mockPhotos);
    });

    it("should discard legacy cache entries without an expiration", async () => {
      (list as jest.Mock).mockResolvedValue({
        blobs: [mockBlob],
      });
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve(mockPhotos),
      });

      const result = await getCachedData(mockKey);

      expect(result).toBeNull();
      expect(del).toHaveBeenCalledWith(mockBlob.url);
    });

    it("should discard expired cache entries", async () => {
      (list as jest.Mock).mockResolvedValue({
        blobs: [mockBlob],
      });
      global.fetch = jest.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: mockPhotos,
            expiresAt: Date.now() - 1,
          }),
      });

      const result = await getCachedData(mockKey);

      expect(result).toBeNull();
      expect(del).toHaveBeenCalledWith(mockBlob.url);
    });

    it("should return null when no matching blob is found", async () => {
      // Mock list to return no matching blobs
      (list as jest.Mock).mockResolvedValue({
        blobs: [
          {
            ...mockBlob,
            pathname: "different-key",
          },
        ],
      });

      // Call the function
      const result = await getCachedData(mockKey);

      // Check that list was called
      expect(list).toHaveBeenCalledWith({ prefix: mockSanitizedKey });

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

      // Check that fetch was not called
      expect(global.fetch).not.toHaveBeenCalled();

      // Check the result
      expect(result).toBeNull();
    });

    it("should return null when list returns empty array", async () => {
      // Mock list to return empty array
      (list as jest.Mock).mockResolvedValue({
        blobs: [],
      });

      // Call the function
      const result = await getCachedData(mockKey);

      // Check that list was called
      expect(list).toHaveBeenCalledWith({ prefix: mockSanitizedKey });

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

      // Check that fetch was not called
      expect(global.fetch).not.toHaveBeenCalled();

      // Check the result
      expect(result).toBeNull();
    });

    it("should return null on errors from list", async () => {
      // Mock list to throw an error
      (list as jest.Mock).mockRejectedValue(new Error("List error"));

      // Call the function - should return null instead of throwing
      const result = await getCachedData(mockKey);

      // Check that list was called
      expect(list).toHaveBeenCalledWith({ prefix: mockSanitizedKey });

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

      // Should return null on error
      expect(result).toBeNull();
    });

    it("should return null on errors from fetch", async () => {
      // Mock list to return a blob that matches our key
      (list as jest.Mock).mockResolvedValue({
        blobs: [mockBlob],
      });

      // Mock fetch to throw an error
      global.fetch = jest.fn().mockRejectedValue(new Error("Fetch error"));

      // Call the function - should return null instead of throwing
      const result = await getCachedData(mockKey);

      // Check that list was called
      expect(list).toHaveBeenCalledWith({ prefix: mockSanitizedKey });

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

      // Check that fetch was called with the correct URL
      expect(global.fetch).toHaveBeenCalledWith(mockBlob.downloadUrl);

      // Should return null on error
      expect(result).toBeNull();
    });
  });

  describe("setCachedData", () => {
    it("should set data in Vercel Blob with an expiration snapshot", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-07-25T12:00:00.000Z"));
      // Mock put to return a success response
      (put as jest.Mock).mockResolvedValue(mockPutResponse);

      // Call the function
      await setCachedData(mockKey, mockPhotos, 3600);

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

      // Check that put was called with the correct parameters
      const serializedCacheEntry = (put as jest.Mock).mock.calls[0][1];
      expect(JSON.parse(serializedCacheEntry)).toMatchInlineSnapshot(`
        {
          "data": [
            {
              "dateTaken": "2023-01-01T12:00:00.000Z",
              "dateUpload": "2023-01-01T00:00:00.000Z",
              "description": "Test Description",
              "height": 768,
              "id": 123,
              "srcSet": [
                {
                  "description": "Test Description",
                  "height": 768,
                  "src": "http://example.com/large.jpg",
                  "title": "Test Photo",
                  "width": 1024,
                },
              ],
              "tags": "test",
              "title": "Test Photo",
              "views": 100,
              "width": 1024,
            },
          ],
          "expiresAt": 1784984400000,
        }
      `);
      expect(put).toHaveBeenCalledWith(
        mockSanitizedKey,
        serializedCacheEntry,
        expect.objectContaining({
          contentType: "application/json",
          access: "public",
          cacheControlMaxAge: 3600,
          addRandomSuffix: false,
          multipart: false,
        }),
      );
      jest.useRealTimers();
    });

    it("should handle errors from put gracefully", async () => {
      // Mock put to throw an error
      (put as jest.Mock).mockRejectedValue(new Error("Put error"));

      // Call the function - should not throw, just log error
      await setCachedData(mockKey, mockPhotos, 3600);

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

      // Check that put was called with the correct parameters
      expect(put).toHaveBeenCalledWith(
        mockSanitizedKey,
        expect.stringContaining('"expiresAt":'),
        {
          contentType: "application/json",
          access: "public",
          cacheControlMaxAge: 3600,
          addRandomSuffix: false,
          multipart: false,
        },
      );
    });
  });
});
