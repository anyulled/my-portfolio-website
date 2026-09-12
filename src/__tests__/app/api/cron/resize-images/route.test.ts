/** @jest-environment @stryker-mutator/jest-runner/jest-env/node */
// Mock next/server
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status ?? 200,
    })),
  },
}));

jest.mock("@/services/storage/photos");
jest.mock("@/services/mailer");
jest.mock("chalk", () => ({
  green: jest.fn((msg) => msg),
  cyan: jest.fn((msg) => msg),
  red: jest.fn((msg) => msg),
  yellow: jest.fn((msg) => msg),
  gray: jest.fn((msg) => msg),
}));
jest.mock("sharp", () => {
  const mockSharpInstance = {
    metadata: jest
      .fn()
      .mockResolvedValue({ width: 3000, height: 3000, format: "jpeg" }),
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue({
      data: Buffer.alloc(500),
      info: { width: 3000, height: 3000, format: "webp" },
    }),
  };
  return jest.fn(() => mockSharpInstance);
});

describe("Image Resizing Cron Route", () => {
  const context = {
    GET: null as any,
    mailer: null as any,
    photosStorage: null as any,
    mockBucket: null as any,
  };

  const mockFile = (name: string) => ({
    name,
    download: jest.fn().mockResolvedValue([Buffer.alloc(1000)]),
    save: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    metadata: {
      metadata: { width: "3000", height: "3000" },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.CRON_NOTIFICATION_EMAIL = "test@example.com";
    process.env.GCP_HOMEPAGE_BUCKET = "test-bucket";
    process.env.CRON_SECRET = "cron-secret";

    // Import mocks
    context.mailer = require("@/services/mailer");
    context.photosStorage = require("@/services/storage/photos");

    context.mockBucket = {
      getFilesStream: jest.fn(),
      file: jest.fn(),
    };

    context.photosStorage.createStorageClient.mockReturnValue({
      bucket: jest.fn().mockReturnValue(context.mockBucket),
    });

    // Mock console
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Import route
    const route = require("@/app/api/cron/resize-images/route");
    context.GET = route.GET;
  });

  it("rejects unauthorized requests before accessing storage", async () => {
    const response = await context.GET(
      new Request("https://example.com/api/cron/resize-images"),
    );
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ message: "Unauthorized" });
    expect(context.photosStorage.createStorageClient).not.toHaveBeenCalled();
    expect(context.mailer.sendEmailToRecipient).not.toHaveBeenCalled();
  });

  it("skips small WebP images without downloading them", async () => {
    const webpFile = {
      ...mockFile("small.webp"),
      metadata: {
        contentType: "image/webp",
        size: "500",
        metadata: { width: "100", height: "100" },
      },
    };
    context.mockBucket.getFilesStream.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield webpFile;
      },
    });

    const response = await context.GET(
      new Request("https://example.com/api/cron/resize-images", {
        headers: { authorization: "Bearer cron-secret" },
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.skipped).toBe(1);
    expect(webpFile.download).not.toHaveBeenCalled();
  });

  it("reports processing errors from images without dimension metadata", async () => {
    const failingFile = {
      ...mockFile("broken.jpg"),
      metadata: { metadata: {} },
      download: jest.fn().mockRejectedValue(new Error("download failed")),
    };
    context.mockBucket.getFilesStream.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield failingFile;
      },
    });

    const response = await context.GET(
      new Request("https://example.com/api/cron/resize-images", {
        headers: { authorization: "Bearer cron-secret" },
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.errors).toBe(1);
    expect(json.errorList).toEqual([
      { file: "broken.jpg", error: "download failed" },
    ]);
  });

  it("should process images and send email summary", async () => {
    const file1 = mockFile("image1.jpg");
    const file2 = mockFile("image2.png");
    context.mockBucket.getFilesStream.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield file1;
        yield file2;
      },
    });
    context.mockBucket.file.mockImplementation((name: string) =>
      mockFile(name),
    );

    const response = await context.GET(
      new Request("https://example.com/api/cron/resize-images", {
        headers: { authorization: "Bearer cron-secret" },
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.processed).toBe(2);

    expect(context.mailer.sendEmailToRecipient).toHaveBeenCalledWith(
      expect.stringContaining("Job Summary"),
      "test@example.com",
      expect.stringContaining("[Cron] Image Resizing Job Completed"),
    );
    expect(context.mailer.sendEmailToRecipient).toHaveBeenCalledWith(
      expect.stringContaining("Processed: 2"),
      "test@example.com",
      expect.any(String),
    );
  });
});
