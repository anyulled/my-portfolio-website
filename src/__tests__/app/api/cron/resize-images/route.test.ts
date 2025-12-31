/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */

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
  let GET: any;
  let mailer: any;
  let photosStorage: any;
  let mockBucket: any;

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
    mailer = require("@/services/mailer");
    photosStorage = require("@/services/storage/photos");

    mockBucket = {
      getFiles: jest.fn(),
      file: jest.fn(),
    };

    photosStorage.createStorageClient.mockReturnValue({
      bucket: jest.fn().mockReturnValue(mockBucket),
    });

    // Mock console
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Import route
    const route = require("@/app/api/cron/resize-images/route");
    GET = route.GET;
  });

  it("should process images and send email summary", async () => {
    const file1 = mockFile("image1.jpg");
    const file2 = mockFile("image2.png");
    mockBucket.getFiles.mockResolvedValue([[file1, file2]]);
    mockBucket.file.mockImplementation((name: string) => mockFile(name));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.processed).toBe(2);

    expect(mailer.sendEmailToRecipient).toHaveBeenCalledWith(
      expect.stringContaining("Job Summary"),
      "test@example.com",
      expect.stringContaining("[Cron] Image Resizing Job Completed"),
    );
    expect(mailer.sendEmailToRecipient).toHaveBeenCalledWith(
      expect.stringContaining("Processed: 2"),
      "test@example.com",
      expect.any(String),
    );
  });
});
