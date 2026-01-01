
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
    toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(500)),
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

    // Import mocks
    context.mailer = require("@/services/mailer");
    context.photosStorage = require("@/services/storage/photos");

    context.mockBucket = {
      getFiles: jest.fn(),
      file: jest.fn(),
    };

    context.photosStorage.createStorageClient.mockReturnValue({
      bucket: jest.fn().mockReturnValue(context.mockBucket),
    });

    // Mock console
    jest.spyOn(console, "log").mockImplementation(() => { });
    jest.spyOn(console, "error").mockImplementation(() => { });

    // Import route
    const route = require("@/app/api/cron/resize-images/route");
    context.GET = route.GET;
  });

  it("should process images and send email summary", async () => {
    const file1 = mockFile("image1.jpg");
    const file2 = mockFile("image2.png");
    context.mockBucket.getFiles.mockResolvedValue([[file1, file2]]);
    context.mockBucket.file.mockImplementation((name: string) => mockFile(name));

    const response = await context.GET();
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
