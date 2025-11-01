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
    metadata: Record<string, string | undefined>;
    size?: string;
    updated?: string;
  };
};

const createMockFile = (overrides: Partial<TestStorageFile> = {}): TestStorageFile => {
  const baseMetadata = {
    metadata: {
      width: "4000",
      height: "3000",
      title: "Sunset Silhouette",
      description: "A dramatic sunset silhouette",
      caption: "Sunset",
      views: "42",
      id: "101",
      dateTaken: "2024-01-15T17:30:00Z",
      dateUploaded: "2024-01-16T10:00:00Z",
      variants: JSON.stringify({
        thumbnail: { path: "thumb.jpg", width: 150, height: 150 },
        small: { path: "small.jpg", width: 320, height: 240 },
        medium: { path: "medium.jpg", width: 640, height: 480 },
        normal: { path: "normal.jpg", width: 1024, height: 768 },
        large: { path: "large.jpg", width: 1600, height: 1200 },
        crop: { path: "crop.jpg", width: 800, height: 600 },
        zoom: { path: "zoom.jpg", width: 2048, height: 1536 },
        original: { path: "original.jpg", width: 4000, height: 3000 },
      }),
    },
    size: "12345",
    updated: "2024-01-16T10:00:00Z",
  } satisfies TestStorageFile["metadata"];

  const metadata = {
    ...baseMetadata,
    ...(overrides.metadata ?? {}),
    metadata:
      overrides.metadata && "metadata" in overrides.metadata
        ? (overrides.metadata.metadata ?? {})
        : baseMetadata.metadata,
  } satisfies TestStorageFile["metadata"];

  return {
    name: overrides.name ?? "gallery/photo-1.jpg",
    metadata,
    publicUrl:
      overrides.publicUrl ??
        (() =>
          "https://storage.googleapis.com/sensuelle-boudoir-homepage/gallery/photo-1.jpg"),
  };
};

describe("homepage storage service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GCP_HOMEPAGE_CDN_URL;
    process.env.GCP_HOMEPAGE_BUCKET = "sensuelle-boudoir-homepage";
  });

  it("maps storage files to the gallery photo shape", async () => {
    const mockFiles = [createMockFile()];
    const bucket = {
      getFiles: jest.fn().mockResolvedValue([mockFiles]),
    };

    const storage = {
      bucket: jest.fn().mockReturnValue(bucket),
    } as unknown as StorageClient;

    const photos = await listHomepagePhotos(storage);

    expect(storage.bucket).toHaveBeenCalledWith("sensuelle-boudoir-homepage");
    expect(bucket.getFiles).toHaveBeenCalledWith({ autoPaginate: false });
    expect(photos).toHaveLength(1);

    const [photo] = photos as Photo[];

    expect(photo.id).toBe(101);
    expect(photo.title).toBe("Sunset Silhouette");
    expect(photo.urlOriginal).toBe(
      "https://storage.googleapis.com/sensuelle-boudoir-homepage/original.jpg",
    );
    expect(photo.srcSet).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "https://storage.googleapis.com/sensuelle-boudoir-homepage/original.jpg",
          width: 4000,
        }),
        expect.objectContaining({
          src: "https://storage.googleapis.com/sensuelle-boudoir-homepage/medium.jpg",
          width: 640,
        }),
      ]),
    );
  });

  it("filters out photos missing an id", async () => {
    const baseMetadata = createMockFile().metadata.metadata;
    const mockFiles = [
      createMockFile({
        metadata: {
          metadata: {
            ...baseMetadata,
            id: undefined,
          },
        },
      }),
    ];

    const bucket = {
      getFiles: jest.fn().mockResolvedValue([mockFiles]),
    };

    const storage = {
      bucket: jest.fn().mockReturnValue(bucket),
    } as unknown as StorageClient;

    const photos = await listHomepagePhotos(storage);

    expect(photos).toEqual([]);
  });

  it("returns an empty array when files do not include gallery metadata", async () => {
    const mockFiles = [
      createMockFile({
        metadata: { metadata: {} },
      }),
    ];

    const bucket = {
      getFiles: jest.fn().mockResolvedValue([mockFiles]),
    };

    const storage = {
      bucket: jest.fn().mockReturnValue(bucket),
    } as unknown as StorageClient;

    const photos = await listHomepagePhotos(storage);

    expect(photos).toEqual([]);
  });

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
});
