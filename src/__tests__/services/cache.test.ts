import { getCachedData, setCachedData } from "@/services/cache";
import type { Photo } from "@/types/photos";
import { sanitizeKey } from "@/lib/sanitizer";
// Import the mocked functions after mocking
import { list, put } from "@vercel/blob";

// Mock the dependencies
jest.mock("@vercel/blob", () => ({
  list: jest.fn(),
  put: jest.fn()
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
      dateTaken: new Date("2023-01-01T12:00:00"),
      dateUpload: new Date("2023-01-01T00:00:00"),
      tags: "test",
      views: 100,
      urlSmall: "http://example.com/small.jpg",
      urlMedium: "http://example.com/medium.jpg",
      urlNormal: "http://example.com/normal.jpg",
      urlLarge: "http://example.com/large.jpg",
      urlOriginal: "http://example.com/original.jpg",
      urlThumbnail: "http://example.com/thumbnail.jpg",
      urlZoom: "http://example.com/zoom.jpg",
      urlCrop: "http://example.com/crop.jpg",
      width: "2048",
      height: "1536",
      srcSet: []
    }
  ];

  // Mock Vercel Blob response
  const mockBlob = {
    pathname: mockSanitizedKey,
    downloadUrl: "https://example.com/download",
    contentType: "application/json",
    contentLength: 1000,
    uploadedAt: new Date().toISOString()
  };

  // Mock put response
  const mockPutResponse = {
    url: "https://example.com/upload",
    pathname: mockSanitizedKey
  };

  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();

    // Mock sanitizeKey to return a predictable value
    (sanitizeKey as jest.Mock).mockReturnValue(mockSanitizedKey);

    // Mock global fetch
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockPhotos)
      })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getCachedData", () => {
    it("should return cached data when available", async () => {
      // Mock list to return a blob that matches our key
      (list as jest.Mock).mockResolvedValue({
        blobs: [mockBlob]
      });

      // Call the function
      const result = await getCachedData(mockKey);

      // Check that list was called
      expect(list).toHaveBeenCalled();

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

      // Check that fetch was called with the correct URL
      expect(global.fetch).toHaveBeenCalledWith(mockBlob.downloadUrl);

      // Check the result
      expect(result).toEqual(mockPhotos);
    });

    it("should return null when no matching blob is found", async () => {
      // Mock list to return no matching blobs
      (list as jest.Mock).mockResolvedValue({
        blobs: [
          {
            ...mockBlob,
            pathname: "different-key"
          }
        ]
      });

      // Call the function
      const result = await getCachedData(mockKey);

      // Check that list was called
      expect(list).toHaveBeenCalled();

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
        blobs: []
      });

      // Call the function
      const result = await getCachedData(mockKey);

      // Check that list was called
      expect(list).toHaveBeenCalled();

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

      // Check that fetch was not called
      expect(global.fetch).not.toHaveBeenCalled();

      // Check the result
      expect(result).toBeNull();
    });

    it("should handle errors from list", async () => {
      // Mock list to throw an error
      (list as jest.Mock).mockRejectedValue(new Error("List error"));

      // Call the function and expect it to throw
      await expect(getCachedData(mockKey)).rejects.toThrow("List error");

      // Check that list was called
      expect(list).toHaveBeenCalled();

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);
    });

    it("should handle errors from fetch", async () => {
      // Mock list to return a blob that matches our key
      (list as jest.Mock).mockResolvedValue({
        blobs: [mockBlob]
      });

      // Mock fetch to throw an error
      global.fetch = jest.fn().mockRejectedValue(new Error("Fetch error"));

      // Call the function and expect it to throw
      await expect(getCachedData(mockKey)).rejects.toThrow("Fetch error");

      // Check that list was called
      expect(list).toHaveBeenCalled();

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

      // Check that fetch was called with the correct URL
      expect(global.fetch).toHaveBeenCalledWith(mockBlob.downloadUrl);
    });
  });

  describe("setCachedData", () => {
    it("should set data in Vercel Blob with the correct parameters", async () => {
      // Mock put to return a success response
      (put as jest.Mock).mockResolvedValue(mockPutResponse);

      // Call the function
      await setCachedData(mockKey, mockPhotos, 3600);

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

      // Check that put was called with the correct parameters
      expect(put).toHaveBeenCalledWith(
        mockSanitizedKey,
        JSON.stringify(mockPhotos),
        {
          contentType: "application/json",
          access: "public",
          cacheControlMaxAge: 3600,
          addRandomSuffix: false,
          multipart: false
        }
      );
    });

    it("should handle errors from put", async () => {
      // Mock put to throw an error
      (put as jest.Mock).mockRejectedValue(new Error("Put error"));

      // Call the function and expect it to throw
      await expect(
        setCachedData(mockKey, mockPhotos, 3600)
      ).rejects.toThrow("Put error");

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

      // Check that put was called with the correct parameters
      expect(put).toHaveBeenCalledWith(
        mockSanitizedKey,
        JSON.stringify(mockPhotos),
        {
          contentType: "application/json",
          access: "public",
          cacheControlMaxAge: 3600,
          addRandomSuffix: false,
          multipart: false
        }
      );
    });
  });
});
