import type { Photo } from "@/types/photos";
import {
  listHomepagePhotos,
  type StorageClient,
  type StorageFileLike,
} from "@/services/storage/homepage";
import { captureException } from "@sentry/nextjs";

jest.mock("@google-cloud/storage", () => ({
  Storage: jest.fn(),
}));

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
}));

type TestStorageFile = StorageFileLike & {
  metadata: {
    size?: string | number;
    updated?: string;
    timeCreated?: string;
    contentType?: string;
  };
  getSignedUrl: jest.Mock<Promise<[string]>>;
};

/**
 * Creates a mock GCS file object for testing.
 * @param name - Filename in format "name_flickrid_o.jpg"
 * @param overrides - Optional overrides for the mock
 */
const createMockFile = (
  name: string = "andrea-cano-montull_54701383010_o.jpg",
  overrides: Partial<TestStorageFile> = {}
): TestStorageFile => {
  // Only use base metadata if no metadata override is provided
  const metadata = overrides.metadata ?? {
    size: 2915154,
    updated: "2025-12-01T19:24:04.154Z",
    timeCreated: "2025-11-01T18:56:28.500Z",
    contentType: "image/jpeg",
  };

  return {
    name,
    metadata,
    publicUrl:
      overrides.publicUrl ??
      (() => `https://storage.googleapis.com/sensuelle-boudoir-homepage/${name}`),
    getSignedUrl:
      overrides.getSignedUrl ??
      (jest.fn().mockResolvedValue([
        `https://signed.example.com/sensuelle-boudoir-homepage/${name}`,
      ]) as unknown as TestStorageFile["getSignedUrl"]),
  } as TestStorageFile;
};

describe("homepage storage service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GCP_HOMEPAGE_BUCKET = "sensuelle-boudoir-homepage";
  });

  describe("filename parsing", () => {
    it("extracts ID and title from standard filename format", async () => {
      const mockFiles = [createMockFile("andrea-cano-montull_54701383010_o.jpg")];
      const bucket = {
        getFiles: jest.fn().mockResolvedValue([mockFiles]),
      };

      const storage = {
        bucket: jest.fn().mockReturnValue(bucket),
      } as unknown as StorageClient;

      const photos = await listHomepagePhotos(storage);

      expect(photos).toHaveLength(1);
      const [photo] = photos as Photo[];

      expect(photo.id).toBe(54701383010);
      expect(photo.title).toBe("Andrea Cano Montull");
    });

    it("extracts ID from filename with compound name", async () => {
      const mockFiles = [createMockFile("sadie-gray-in-the-bedroom_54755963626_o.jpg")];
      const bucket = {
        getFiles: jest.fn().mockResolvedValue([mockFiles]),
      };

      const storage = {
        bucket: jest.fn().mockReturnValue(bucket),
      } as unknown as StorageClient;

      const photos = await listHomepagePhotos(storage);

      expect(photos).toHaveLength(1);
      const [photo] = photos as Photo[];

      expect(photo.id).toBe(54755963626);
      expect(photo.title).toBe("Sadie Gray In The Bedroom");
    });

    it("extracts ID using fallback pattern when _o suffix is missing", async () => {
      const mockFiles = [createMockFile("photo_12345.jpg")];
      const bucket = {
        getFiles: jest.fn().mockResolvedValue([mockFiles]),
      };

      const storage = {
        bucket: jest.fn().mockReturnValue(bucket),
      } as unknown as StorageClient;

      const photos = await listHomepagePhotos(storage);

      expect(photos).toHaveLength(1);
      expect(photos![0].id).toBe(12345);
    });

    it("skips files that cannot have an ID extracted", async () => {
      const mockFiles = [createMockFile("no-id-here.jpg")];
      const bucket = {
        getFiles: jest.fn().mockResolvedValue([mockFiles]),
      };

      const storage = {
        bucket: jest.fn().mockReturnValue(bucket),
      } as unknown as StorageClient;

      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });

      const photos = await listHomepagePhotos(storage);

      expect(photos).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Could not extract ID from filename"),
      );

      warnSpy.mockRestore();
    });
  });

  describe("URL handling", () => {
    it("uses signed URLs when available", async () => {
      const mockFile = createMockFile();
      const bucket = {
        getFiles: jest.fn().mockResolvedValue([[mockFile]]),
      };

      const storage = {
        bucket: jest.fn().mockReturnValue(bucket),
      } as unknown as StorageClient;

      const photos = await listHomepagePhotos(storage);

      expect(mockFile.getSignedUrl).toHaveBeenCalled();
      expect(photos?.[0]?.urlOriginal).toBe(
        "https://signed.example.com/sensuelle-boudoir-homepage/andrea-cano-montull_54701383010_o.jpg",
      );
    });

    it("falls back to public URL when signed URL generation fails", async () => {
      const mockFile = createMockFile("andrea-cano-montull_54701383010_o.jpg", {
        getSignedUrl: jest
          .fn()
          .mockRejectedValue(new Error("signing failed")) as unknown as TestStorageFile["getSignedUrl"],
      });

      const bucket = {
        getFiles: jest.fn().mockResolvedValue([[mockFile]]),
      };

      const storage = {
        bucket: jest.fn().mockReturnValue(bucket),
      } as unknown as StorageClient;

      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });

      const photos = await listHomepagePhotos(storage);

      expect(mockFile.getSignedUrl).toHaveBeenCalled();
      expect(photos?.[0]?.urlOriginal).toBe(
        "https://storage.googleapis.com/sensuelle-boudoir-homepage/andrea-cano-montull_54701383010_o.jpg",
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to sign URL"),
      );

      warnSpy.mockRestore();
    });
  });

  describe("metadata handling", () => {
    it("uses updated date from GCS metadata", async () => {
      const mockFiles = [createMockFile("test_123_o.jpg", {
        metadata: {
          updated: "2025-06-15T12:00:00Z",
        },
      })];
      const bucket = {
        getFiles: jest.fn().mockResolvedValue([mockFiles]),
      };

      const storage = {
        bucket: jest.fn().mockReturnValue(bucket),
      } as unknown as StorageClient;

      const photos = await listHomepagePhotos(storage);

      expect(photos?.[0]?.dateUpload).toEqual(new Date("2025-06-15T12:00:00Z"));
    });

    it("falls back to timeCreated when updated is not available", async () => {
      const mockFiles = [createMockFile("test_456_o.jpg", {
        metadata: {
          timeCreated: "2025-01-01T00:00:00Z",
        },
      })];
      const bucket = {
        getFiles: jest.fn().mockResolvedValue([mockFiles]),
      };

      const storage = {
        bucket: jest.fn().mockReturnValue(bucket),
      } as unknown as StorageClient;

      const photos = await listHomepagePhotos(storage);

      expect(photos?.[0]?.dateUpload).toEqual(new Date("2025-01-01T00:00:00Z"));
    });

    it("sets default values for unavailable metadata fields", async () => {
      const mockFiles = [createMockFile()];
      const bucket = {
        getFiles: jest.fn().mockResolvedValue([mockFiles]),
      };

      const storage = {
        bucket: jest.fn().mockReturnValue(bucket),
      } as unknown as StorageClient;

      const photos = await listHomepagePhotos(storage);

      const photo = photos![0];
      expect(photo.description).toBe("");
      expect(photo.width).toBe("0");
      expect(photo.height).toBe("0");
      expect(photo.views).toBe(0);
      expect(photo.tags).toBe("");
    });
  });

  describe("error handling", () => {
    it("captures errors and returns null when the storage request fails", async () => {
      const bucket = {
        getFiles: jest.fn().mockRejectedValue(new Error("boom")),
      };

      const storage = {
        bucket: jest.fn().mockReturnValue(bucket),
      } as unknown as StorageClient;

      const photos = await listHomepagePhotos(storage);

      expect(photos).toBeNull();
      expect(captureException).toHaveBeenCalledWith(expect.any(Error));
    });

    it("returns empty array when bucket has no files", async () => {
      const bucket = {
        getFiles: jest.fn().mockResolvedValue([[]]),
      };

      const storage = {
        bucket: jest.fn().mockReturnValue(bucket),
      } as unknown as StorageClient;

      const photos = await listHomepagePhotos(storage);

      expect(photos).toEqual([]);
    });
  });

  describe("bucket configuration", () => {
    it("uses the bucket name from environment variable", async () => {
      process.env.GCP_HOMEPAGE_BUCKET = "custom-bucket-name";

      const bucket = {
        getFiles: jest.fn().mockResolvedValue([[]]),
      };

      const storage = {
        bucket: jest.fn().mockReturnValue(bucket),
      } as unknown as StorageClient;

      await listHomepagePhotos(storage);

      expect(storage.bucket).toHaveBeenCalledWith("custom-bucket-name");
    });

    it("uses default bucket name when env var is not set", async () => {
      delete process.env.GCP_HOMEPAGE_BUCKET;

      const bucket = {
        getFiles: jest.fn().mockResolvedValue([[]]),
      };

      const storage = {
        bucket: jest.fn().mockReturnValue(bucket),
      } as unknown as StorageClient;

      await listHomepagePhotos(storage);

      expect(storage.bucket).toHaveBeenCalledWith("sensuelle-boudoir-homepage");
    });
  });
});
