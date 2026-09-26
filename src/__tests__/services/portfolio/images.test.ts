jest.mock("server-only", () => ({}));
jest.mock("@/lib/gcp/storage-client", () => ({
  createGCPStorageClient: jest.fn(),
}));
jest.mock("@/services/storage/photos", () => ({
  DEFAULT_BUCKET_NAME: "default-bucket",
}));
jest.mock("@/services/portfolio/drive", () => ({
  downloadDriveImage: jest.fn(),
}));
jest.mock("sharp", () => jest.fn());

import { createGCPStorageClient } from "@/lib/gcp/storage-client";
import { downloadDriveImage } from "@/services/portfolio/drive";
import {
  deletePortfolioPhotoObjects,
  uploadDriveImages,
} from "@/services/portfolio/images";
import sharp from "sharp";

const mockSave = jest.fn();
const mockDelete = jest.fn();
const mockPublicUrl = jest.fn(() => "https://storage.example/photo.webp");
const mockFile = jest.fn(() => ({
  save: mockSave,
  delete: mockDelete,
  publicUrl: mockPublicUrl,
}));
const mockBucket = jest.fn(() => ({ file: mockFile }));
const mockStorage = jest.mocked(createGCPStorageClient);
const mockDownloadDriveImage = jest.mocked(downloadDriveImage);
const mockSharp = jest.mocked(sharp);

describe("portfolio image storage", () => {
  const logError = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.mockReturnValue({ bucket: mockBucket } as never);
    delete process.env.GCP_HOMEPAGE_BUCKET;
    mockDownloadDriveImage.mockResolvedValue({
      name: "portrait.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("source"),
    });
    mockSave.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
    mockSharp.mockImplementation(
      () =>
        ({
          rotate: () => ({
            resize: () => ({
              webp: () => ({
                toBuffer: async () => ({
                  data: Buffer.from("webp"),
                  info: { width: 900, height: 1200 },
                }),
              }),
            }),
          }),
        }) as never,
    );
  });

  afterAll(() => logError.mockRestore());

  it("copies selected Drive photos as ordered optimized WebP objects", async () => {
    process.env.GCP_HOMEPAGE_BUCKET = "portfolio-bucket";
    const uploaded = await uploadDriveImages("collection-id", [
      { id: "first", name: "first.jpg" },
      { id: "second", name: "second.jpg" },
    ]);
    expect(uploaded).toHaveLength(2);
    expect(
      uploaded.map(({ position, driveFileId, altText }) => ({
        position,
        driveFileId,
        altText,
      })),
    ).toEqual([
      { position: 0, driveFileId: "first", altText: "portrait.jpg" },
      { position: 1, driveFileId: "second", altText: "portrait.jpg" },
    ]);
    expect(uploaded[0].objectPath).toMatch(
      /^portfolio\/collection-id\/.+\.webp$/,
    );
    expect(uploaded[0].publicUrl).toBe("https://storage.example/photo.webp");
    expect(createGCPStorageClient).toHaveBeenCalledTimes(1);
    expect(mockBucket).toHaveBeenCalledWith("portfolio-bucket");
    expect(mockSave).toHaveBeenCalledWith(
      Buffer.from("webp"),
      expect.objectContaining({
        resumable: false,
        contentType: "image/webp",
        metadata: expect.objectContaining({
          cacheControl: "public, max-age=31536000, immutable",
        }),
      }),
    );
  });

  it("uses the default bucket and deletes staged objects if an upload fails", async () => {
    mockSave
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("storage failed"));
    await expect(
      uploadDriveImages("collection-id", [
        { id: "first", name: "first.jpg" },
        { id: "second", name: "second.jpg" },
      ]),
    ).rejects.toThrow("storage failed");
    expect(mockBucket).toHaveBeenCalledWith("default-bucket");
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it("skips empty deletions and logs when cleanup partially fails", async () => {
    await deletePortfolioPhotoObjects([]);
    expect(createGCPStorageClient).not.toHaveBeenCalled();
    mockDelete
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("delete failed"));
    await deletePortfolioPhotoObjects(["one.webp", "two.webp"]);
    expect(logError).toHaveBeenCalledWith("portfolio_photo_cleanup_failed", {
      failedCount: 1,
    });
  });
});
