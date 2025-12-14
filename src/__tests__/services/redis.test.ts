import { Redis } from "@upstash/redis";
import { getCachedData, setCachedData } from "@/services/redis";
import type { Photo } from "@/types/photos";
import { sanitizeKey } from "@/lib/sanitizer";

describe.skip("Redis Service", () => {
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

  const mockRedisGet = jest.fn();
  const mockRedisSet = jest.fn();
  const mockRedisTtl = jest.fn();
  const mockRedis = {
    get: mockRedisGet,
    set: mockRedisSet,
    ttl: mockRedisTtl
  };

  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();

    // Mock Redis.fromEnv to return our mock Redis client
    (Redis.fromEnv as jest.Mock).mockReturnValue(mockRedis);

    // Mock sanitizeKey to return a predictable value
    (sanitizeKey as jest.Mock).mockReturnValue(mockSanitizedKey);
  });

  describe.skip("getCachedData", () => {
    it("should return cached data when available", async () => {
      // Mock Redis.get to return data and ttl to return expiry
      mockRedisGet.mockResolvedValue(mockPhotos);
      mockRedisTtl.mockResolvedValue(3600);

      // Call the function
      const result = await getCachedData(mockKey);

      // Check that Redis.fromEnv was called
      expect(Redis.fromEnv).toHaveBeenCalled();

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

      // Check that Redis.get and ttl were called with the correct key
      expect(mockRedisGet).toHaveBeenCalledWith(mockSanitizedKey);
      expect(mockRedisTtl).toHaveBeenCalledWith(mockSanitizedKey);

      // Check that the result includes the expiry time
      expect(result).toEqual(
        mockPhotos.map((photo) => ({
          ...photo,
          expiresAt: 3600
        }))
      );
    });

    it("should return null when cache is empty", async () => {
      // Mock Redis.get to return null
      mockRedisGet.mockResolvedValue(null);
      mockRedisTtl.mockResolvedValue(0);

      // Call the function
      const result = await getCachedData(mockKey);

      // Check that Redis.fromEnv was called
      expect(Redis.fromEnv).toHaveBeenCalled();

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

      // Check that Redis.get and ttl were called with the correct key
      expect(mockRedisGet).toHaveBeenCalledWith(mockSanitizedKey);
      expect(mockRedisTtl).toHaveBeenCalledWith(mockSanitizedKey);

      expect(result).toBeNull();
    });

    it("should handle errors from Redis", async () => {
      // Mock Redis.get to throw an error
      mockRedisGet.mockRejectedValue(new Error("Redis error"));
      mockRedisTtl.mockResolvedValue(0);

      // Call the function and expect it to throw
      await expect(getCachedData(mockKey)).rejects.toThrow("Redis error");

      // Check that Redis.fromEnv was called
      expect(Redis.fromEnv).toHaveBeenCalled();

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

      // Check that Redis.get and ttl were called with the correct key
      expect(mockRedisGet).toHaveBeenCalledWith(mockSanitizedKey);
      expect(mockRedisTtl).toHaveBeenCalledWith(mockSanitizedKey);
    });
  });

  describe.skip("setCachedData", () => {
    it("should set data in Redis with the correct expiry", async () => {
      // Mock Redis.set to return OK
      mockRedisSet.mockResolvedValue("OK");

      // Call the function
      await setCachedData(mockKey, mockPhotos, 3600);

      // Check that Redis.fromEnv was called
      expect(Redis.fromEnv).toHaveBeenCalled();

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

      // Check that Redis.set was called with the correct parameters
      expect(mockRedisSet).toHaveBeenCalledWith(
        mockSanitizedKey,
        JSON.stringify(mockPhotos),
        { ex: 3600 }
      );
    });

    it("should handle errors from Redis", async () => {
      // Mock Redis.set to throw an error
      mockRedisSet.mockRejectedValue(new Error("Redis error"));

      // Call the function and expect it to throw
      await expect(
        setCachedData(mockKey, mockPhotos, 3600)
      ).rejects.toThrow("Redis error");

      // Check that Redis.fromEnv was called
      expect(Redis.fromEnv).toHaveBeenCalled();

      // Check that sanitizeKey was called with the correct key
      expect(sanitizeKey).toHaveBeenCalledWith(mockKey);

      // Check that Redis.set was called with the correct parameters
      expect(mockRedisSet).toHaveBeenCalledWith(
        mockSanitizedKey,
        JSON.stringify(mockPhotos),
        { ex: 3600 }
      );
    });
  });
});
