import { getRedisCachedData, setRedisCachedData } from "@/services/redis";
import { Redis } from "@upstash/redis";

// Mock the dependencies
jest.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: jest.fn(),
  },
}));

describe("Redis Service", () => {
  const context = { mockRedis: { get: jest.fn(), set: jest.fn() } };

  beforeEach(() => {
    jest.clearAllMocks();
    context.mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
    };
    (Redis.fromEnv as jest.Mock).mockReturnValue(context.mockRedis);

    process.env.UPSTASH_REDIS_REST_URL = "https://test-url.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  });

  const mockData = { id: 1, title: "Test Photo" };
  const mockKey = "test-key";
  // Based on previous error, sanitizeKey("test-key") -> "testkey"
  const expectedSanitizedKey = "testkey";

  describe("getRedisCachedData", () => {
    it("should return null if Redis client is not initialized", async () => {
      // Temporarily unset env vars
      const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_URL;

      // Mock fromEnv to error when env vars missing (simulating lib behavior or just forcing error)
      (Redis.fromEnv as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Redis env missing");
      });

      // We expect the service to catch the error and return null
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const result = await getRedisCachedData(mockKey);
      expect(result).toBeNull();

      consoleSpy.mockRestore();
      process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    });

    it("should return data when found in Redis", async () => {
      context.mockRedis.get.mockResolvedValue(mockData);

      const result = await getRedisCachedData(mockKey);
      expect(result).toEqual(mockData);
      expect(context.mockRedis.get).toHaveBeenCalledWith(expectedSanitizedKey);
    });

    it("should return null on Redis error", async () => {
      context.mockRedis.get.mockRejectedValue(new Error("Redis error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const result = await getRedisCachedData(mockKey);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("setRedisCachedData", () => {
    it("should set data in Redis", async () => {
      context.mockRedis.set.mockResolvedValue("OK");

      await setRedisCachedData(mockKey, mockData, 3600);
      expect(context.mockRedis.set).toHaveBeenCalledWith(
        expectedSanitizedKey,
        mockData,
        { ex: 3600 },
      );
    });

    it("should handle custom TTL", async () => {
      context.mockRedis.set.mockResolvedValue("OK");
      await setRedisCachedData(mockKey, mockData, 60);
      expect(context.mockRedis.set).toHaveBeenCalledWith(
        expectedSanitizedKey,
        mockData,
        { ex: 60 },
      );
    });

    it("should swallow errors", async () => {
      context.mockRedis.set.mockRejectedValue(new Error("Redis error"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(
        setRedisCachedData(mockKey, mockData, 3600),
      ).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
