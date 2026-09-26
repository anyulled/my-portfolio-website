jest.mock("next/server", () => ({
  connection: jest.fn(),
  NextResponse: class {
    status: number;
    headers: { get: (name: string) => string | null };

    constructor(_body: unknown, init?: ResponseInit) {
      this.status = init?.status ?? 200;
      const headers = new Headers(init?.headers);
      this.headers = { get: (name) => headers.get(name) };
    }

    static json(body: unknown, init?: ResponseInit) {
      return { status: init?.status ?? 200, json: async () => body };
    }
  },
}));
jest.mock("@/services/instagram/auth", () => ({
  getAuthenticatedOperator: jest.fn(),
}));
jest.mock("@/services/harness/mode", () => ({
  isHarnessFixtureMode: jest.fn(),
}));
jest.mock("@/services/portfolio/drive", () => ({
  downloadDriveImage: jest.fn(),
  listDriveFolder: jest.fn(),
}));
jest.mock("sharp", () => jest.fn());

import { GET as listDrive } from "@/app/api/admin/portfolio/drive/route";
import { GET as previewDriveImage } from "@/app/api/admin/portfolio/drive/thumbnail/route";
import { getAuthenticatedOperator } from "@/services/instagram/auth";
import { isHarnessFixtureMode } from "@/services/harness/mode";
import {
  downloadDriveImage,
  listDriveFolder,
} from "@/services/portfolio/drive";
import sharp from "sharp";

const request = (url: string): Request => ({ url }) as Request;

describe("portfolio Drive endpoints", () => {
  const logError = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

  beforeEach(() => {
    jest.mocked(getAuthenticatedOperator).mockResolvedValue({} as never);
    jest.mocked(isHarnessFixtureMode).mockReturnValue(false);
    jest.mocked(listDriveFolder).mockResolvedValue({
      folderId: "root",
      folderName: "tearsheets",
      entries: [],
      nextPageToken: null,
    });
    jest.mocked(downloadDriveImage).mockResolvedValue({
      name: "photo.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("image"),
    });
    const toBuffer = jest.fn().mockResolvedValue(Buffer.from("webp"));
    const webp = jest.fn(() => ({ toBuffer }));
    const resize = jest.fn(() => ({ webp }));
    const rotate = jest.fn(() => ({ resize }));
    jest.mocked(sharp).mockReturnValue({ rotate } as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
    logError.mockClear();
  });

  it("requires operator authentication and blocks fixture browsing", async () => {
    jest.mocked(getAuthenticatedOperator).mockResolvedValueOnce(null as never);
    expect(
      (await listDrive(request("http://localhost/api/admin/portfolio/drive")))
        .status,
    ).toBe(401);
    jest.mocked(isHarnessFixtureMode).mockReturnValueOnce(true);
    expect(
      (await listDrive(request("http://localhost/api/admin/portfolio/drive")))
        .status,
    ).toBe(503);
    expect(listDriveFolder).not.toHaveBeenCalled();
  });

  it("lists the requested folder and page, returning gateway errors from Drive", async () => {
    const response = await listDrive(
      request(
        "http://localhost/api/admin/portfolio/drive?folderId=folder-1&pageToken=page-2",
      ),
    );
    expect(response.status).toBe(200);
    expect(listDriveFolder).toHaveBeenCalledWith("folder-1", "page-2");
    jest
      .mocked(listDriveFolder)
      .mockRejectedValueOnce(new Error("Drive error"));
    expect(
      (await listDrive(request("http://localhost/api/admin/portfolio/drive")))
        .status,
    ).toBe(502);
    expect(logError).toHaveBeenCalledWith(
      "portfolio_drive_listing_failed",
      expect.any(Error),
    );
  });

  it("requires authentication and a file ID before generating a preview", async () => {
    jest.mocked(getAuthenticatedOperator).mockResolvedValueOnce(null as never);
    expect(
      (
        await previewDriveImage(
          request("http://localhost/api/preview?fileId=x"),
        )
      ).status,
    ).toBe(401);
    jest.mocked(isHarnessFixtureMode).mockReturnValueOnce(true);
    expect(
      (
        await previewDriveImage(
          request("http://localhost/api/preview?fileId=x"),
        )
      ).status,
    ).toBe(503);
    expect(
      (await previewDriveImage(request("http://localhost/api/preview"))).status,
    ).toBe(400);
    expect(downloadDriveImage).not.toHaveBeenCalled();
  });

  it("converts a selected Drive image to a private WebP preview", async () => {
    const response = await previewDriveImage(
      request("http://localhost/api/preview?fileId=photo-id"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/webp");
    expect(response.headers.get("Cache-Control")).toBe("private, max-age=300");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(downloadDriveImage).toHaveBeenCalledWith("photo-id");
    expect(sharp).toHaveBeenCalledWith(Buffer.from("image"));
  });

  it("returns a gateway error when the preview cannot be generated", async () => {
    jest
      .mocked(downloadDriveImage)
      .mockRejectedValueOnce(new Error("read error"));
    expect(
      (
        await previewDriveImage(
          request("http://localhost/api/preview?fileId=photo-id"),
        )
      ).status,
    ).toBe(502);
    expect(logError).toHaveBeenCalledWith(
      "portfolio_drive_preview_failed",
      expect.any(Error),
    );
  });
});
