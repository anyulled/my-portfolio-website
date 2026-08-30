import { createGCPStorageClient } from "@/lib/gcp/storage-client";
import { archiveReleasePdf } from "@/services/photographyRelease/archive";

jest.mock("@/lib/gcp/storage-client", () => ({
  createGCPStorageClient: jest.fn(),
}));

describe("archiveReleasePdf", () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const file = jest.fn().mockReturnValue({ save });
  const bucket = jest.fn().mockReturnValue({ file });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GCP_RELEASES_BUCKET = "private-releases";
    jest.mocked(createGCPStorageClient).mockReturnValue({ bucket } as never);
  });

  afterEach(() => {
    delete process.env.GCP_RELEASES_BUCKET;
  });

  it("stores the PDF in the dedicated bucket with indefinite retention metadata", async () => {
    const objectName = await archiveReleasePdf(
      Buffer.from("pdf"),
      "2026-08-31",
    );

    expect(objectName).toMatch(/^photography-releases\/2026-08\/[^/]+\.pdf$/);
    expect(bucket).toHaveBeenCalledWith("private-releases");
    expect(file).toHaveBeenCalledWith(objectName);
    expect(save).toHaveBeenCalledWith(
      Buffer.from("pdf"),
      expect.objectContaining({
        resumable: false,
        contentType: "application/pdf",
        metadata: {
          metadata: {
            sessionDate: "2026-08-31",
            retention: "indefinite",
          },
        },
      }),
    );
  });

  it("requires a dedicated archive bucket configuration", async () => {
    delete process.env.GCP_RELEASES_BUCKET;

    await expect(
      archiveReleasePdf(Buffer.from("pdf"), "2026-08-31"),
    ).rejects.toThrow("GCP_RELEASES_BUCKET is not configured");
  });
});
