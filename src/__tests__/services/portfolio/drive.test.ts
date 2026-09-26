jest.mock("server-only", () => ({}));
const mockRequest = jest.fn();
jest.mock("google-auth-library", () => ({
  GoogleAuth: jest.fn().mockImplementation(() => ({
    getClient: async () => ({ request: mockRequest }),
  })),
}));

import { GoogleAuth } from "google-auth-library";
import {
  downloadDriveImage,
  listDriveFolder,
} from "@/services/portfolio/drive";

const originalEnvironment = { ...process.env };

const configureDrive = () => {
  process.env.GCP_PRIVATE_KEY = "private\\nkey";
  process.env.GCP_CLIENT_EMAIL = "drive@example.com";
  process.env.GOOGLE_DRIVE_TEARSHEETS_FOLDER_ID = "root";
};

describe("Google Drive portfolio library", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnvironment };
    configureDrive();
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it("requires its service credential and configured library folder", async () => {
    delete process.env.GCP_PRIVATE_KEY;
    await expect(listDriveFolder()).rejects.toThrow(
      "GCP_PRIVATE_KEY is required",
    );
    process.env.GCP_PRIVATE_KEY = "private-key";
    delete process.env.GCP_CLIENT_EMAIL;
    delete process.env.GCP_SERVICE_ACCOUNT_EMAIL;
    await expect(listDriveFolder()).rejects.toThrow(
      "GCP_SERVICE_ACCOUNT_EMAIL is required",
    );
    process.env.GCP_CLIENT_EMAIL = "drive@example.com";
    delete process.env.GOOGLE_DRIVE_TEARSHEETS_FOLDER_ID;
    await expect(listDriveFolder()).rejects.toThrow(
      "GOOGLE_DRIVE_TEARSHEETS_FOLDER_ID is required",
    );
  });

  it("lists folders and images while filtering unsupported file types", async () => {
    mockRequest
      .mockResolvedValueOnce({
        data: {
          nextPageToken: "next-page",
          files: [
            {
              id: "folder",
              name: "Models",
              mimeType: "application/vnd.google-apps.folder",
            },
            { id: "image", name: "portrait.jpg", mimeType: "image/jpeg" },
            { id: "document", name: "notes.pdf", mimeType: "application/pdf" },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: "root",
          name: "tearsheets",
          mimeType: "application/vnd.google-apps.folder",
        },
      });

    await expect(listDriveFolder("root", "next-page")).resolves.toEqual({
      folderId: "root",
      folderName: "tearsheets",
      nextPageToken: "next-page",
      entries: [
        {
          id: "folder",
          name: "Models",
          mimeType: "application/vnd.google-apps.folder",
          isFolder: true,
        },
        {
          id: "image",
          name: "portrait.jpg",
          mimeType: "image/jpeg",
          isFolder: false,
        },
      ],
    });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://www.googleapis.com/drive/v3/files",
        params: expect.objectContaining({
          pageToken: "next-page",
          pageSize: 100,
        }),
      }),
    );
    expect(jest.mocked(GoogleAuth)).toHaveBeenCalledWith(
      expect.objectContaining({
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      }),
    );
  });

  it("allows a nested folder only after tracing it back to tearsheets", async () => {
    mockRequest
      .mockResolvedValueOnce({
        data: {
          id: "nested",
          name: "Models",
          mimeType: "application/vnd.google-apps.folder",
          parents: ["root"],
        },
      })
      .mockResolvedValueOnce({ data: { files: [] } })
      .mockResolvedValueOnce({
        data: {
          id: "nested",
          name: "Models",
          mimeType: "application/vnd.google-apps.folder",
          parents: ["root"],
        },
      });
    await expect(listDriveFolder("nested")).resolves.toMatchObject({
      folderId: "nested",
      folderName: "Models",
    });

    jest.clearAllMocks();
    mockRequest
      .mockResolvedValueOnce({
        data: {
          id: "outside",
          name: "Other",
          mimeType: "application/vnd.google-apps.folder",
          parents: ["elsewhere"],
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: "elsewhere",
          name: "Other root",
          mimeType: "application/vnd.google-apps.folder",
        },
      });
    await expect(listDriveFolder("outside")).rejects.toThrow(
      "outside the tearsheets library",
    );
  });

  it("downloads only images whose parent chain reaches the configured root", async () => {
    mockRequest
      .mockResolvedValueOnce({
        data: {
          id: "photo",
          name: "photo.jpg",
          mimeType: "image/jpeg",
          parents: ["nested"],
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: "nested",
          name: "Models",
          mimeType: "application/vnd.google-apps.folder",
          parents: ["root"],
        },
      })
      .mockResolvedValueOnce({ data: Uint8Array.from([1, 2, 3]).buffer });
    await expect(downloadDriveImage("photo")).resolves.toMatchObject({
      name: "photo.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from([1, 2, 3]),
    });
    expect(mockRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: "https://www.googleapis.com/drive/v3/files/photo",
        params: { alt: "media" },
      }),
    );

    jest.clearAllMocks();
    mockRequest.mockResolvedValueOnce({
      data: {
        id: "folder",
        name: "Models",
        mimeType: "application/vnd.google-apps.folder",
      },
    });
    await expect(downloadDriveImage("folder")).rejects.toThrow(
      "Only image files",
    );

    jest.clearAllMocks();
    mockRequest
      .mockResolvedValueOnce({
        data: {
          id: "photo",
          name: "photo.jpg",
          mimeType: "image/jpeg",
          parents: ["outside"],
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: "outside",
          name: "Outside",
          mimeType: "application/vnd.google-apps.folder",
          parents: ["elsewhere"],
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: "elsewhere",
          name: "Elsewhere",
          mimeType: "application/vnd.google-apps.folder",
        },
      });
    await expect(downloadDriveImage("photo")).rejects.toThrow(
      "outside the tearsheets library",
    );
  });
});
