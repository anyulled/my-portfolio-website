jest.mock("next/server", () => ({
  connection: jest.fn(),
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/services/instagram/auth", () => ({
  getAuthenticatedOperator: jest.fn(),
}));
jest.mock("@/services/harness/mode", () => ({
  isHarnessFixtureMode: jest.fn(),
}));
jest.mock("@/services/portfolio/images", () => ({
  deletePortfolioPhotoObjects: jest.fn(),
  uploadDriveImages: jest.fn(),
}));
jest.mock("@/services/portfolio/repository", () => ({
  createPortfolioModels: jest.fn(),
  deleteUnusedPortfolioModels: jest.fn(),
  getCollectionPhotoPaths: jest.fn(),
  getPortfolioDatabase: jest.fn(() => ({})),
  listPortfolioCollections: jest.fn(),
  listPortfolioModels: jest.fn(),
  savePortfolioCollection: jest.fn(),
  setPortfolioCollectionArchived: jest.fn(),
}));

import { revalidatePath } from "next/cache";
import { getAuthenticatedOperator } from "@/services/instagram/auth";
import { isHarnessFixtureMode } from "@/services/harness/mode";
import {
  deletePortfolioPhotoObjects,
  uploadDriveImages,
} from "@/services/portfolio/images";
import {
  createPortfolioModels,
  deleteUnusedPortfolioModels,
  getCollectionPhotoPaths,
  listPortfolioCollections,
  listPortfolioModels,
  savePortfolioCollection,
  setPortfolioCollectionArchived,
} from "@/services/portfolio/repository";
import { GET, POST } from "@/app/api/admin/portfolio/route";
import { PATCH } from "@/app/api/admin/portfolio/collections/[collectionId]/route";

const validDraft = {
  name: "Editorial Collection",
  slug: "editorial-collection",
  sessionDate: "2026-09-26",
  location: "Barcelona",
  style: "portrait",
  lingerieBrand: "",
  modelIds: ["11111111-1111-4111-8111-111111111111"],
  newModels: [],
  driveImages: [{ id: "drive-image", name: "photo.jpg" }],
};

const request = (body: unknown): Request =>
  ({ json: async () => body }) as Request;

const json = async (response: Response): Promise<unknown> => response.json();

describe("portfolio administration API", () => {
  beforeEach(() => {
    jest.mocked(getAuthenticatedOperator).mockResolvedValue({} as never);
    jest.mocked(isHarnessFixtureMode).mockReturnValue(false);
    jest.mocked(listPortfolioCollections).mockResolvedValue([]);
    jest.mocked(listPortfolioModels).mockResolvedValue([]);
    jest.mocked(uploadDriveImages).mockResolvedValue([
      {
        driveFileId: "drive-image",
        objectPath: "photo.webp",
        publicUrl: "https://example.com/photo.webp",
        altText: "photo.jpg",
        position: 0,
      },
    ]);
    jest.mocked(createPortfolioModels).mockResolvedValue([]);
    jest.mocked(savePortfolioCollection).mockResolvedValue("collection-id");
    jest.mocked(getCollectionPhotoPaths).mockResolvedValue([]);
    jest.mocked(setPortfolioCollectionArchived).mockResolvedValue(undefined);
  });

  afterEach(() => jest.clearAllMocks());

  it("protects admin reads and returns current collections and models", async () => {
    jest.mocked(getAuthenticatedOperator).mockResolvedValueOnce(null as never);
    expect((await GET()).status).toBe(401);
    jest.mocked(isHarnessFixtureMode).mockReturnValueOnce(true);
    expect(await json(await GET())).toEqual({ collections: [], models: [] });
    jest
      .mocked(listPortfolioCollections)
      .mockRejectedValueOnce(new Error("db error"));
    expect((await GET()).status).toBe(503);
    jest.mocked(listPortfolioCollections).mockResolvedValueOnce([]);
    jest.mocked(listPortfolioModels).mockResolvedValueOnce([]);
    expect((await GET()).status).toBe(200);
    expect(listPortfolioCollections).toHaveBeenCalledWith(
      {},
      { includeArchived: true },
    );
  });

  it("rejects unauthorized, fixture, malformed, and invalid collection writes", async () => {
    jest.mocked(getAuthenticatedOperator).mockResolvedValueOnce(null as never);
    expect((await POST(request(validDraft))).status).toBe(401);
    jest.mocked(isHarnessFixtureMode).mockReturnValueOnce(true);
    expect((await POST(request(validDraft))).status).toBe(503);
    const malformed = {
      json: async () => {
        throw new Error("invalid json");
      },
    } as unknown as Request;
    expect((await POST(malformed)).status).toBe(400);
    expect(
      (await POST(request({ ...validDraft, driveImages: [] }))).status,
    ).toBe(400);
    expect(
      (
        await POST(
          request({
            ...validDraft,
            newModels: [{ name: "!!!", profileUrl: "https://model.example" }],
            modelIds: [],
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await POST(
          request({
            ...validDraft,
            newModels: [
              { name: "A", profileUrl: "https://a.example" },
              { name: "A", profileUrl: "https://b.example" },
            ],
            modelIds: [],
          }),
        )
      ).status,
    ).toBe(400);
    expect(uploadDriveImages).not.toHaveBeenCalled();
  });

  it("publishes new collections, removes old objects after edits, and cleans failed saves", async () => {
    const createdId = "22222222-2222-4222-8222-222222222222";
    jest.mocked(createPortfolioModels).mockResolvedValueOnce([
      {
        id: createdId,
        name: "New Model",
        slug: "new-model",
        profileUrl: "https://model.example",
      },
    ]);
    const newDraft = {
      ...validDraft,
      modelIds: [],
      newModels: [{ name: "New Model", profileUrl: "https://model.example" }],
    };
    expect((await POST(request(newDraft))).status).toBe(200);
    expect(savePortfolioCollection).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ id: expect.any(String) }),
      [{ id: createdId }],
      expect.any(Array),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/portfolio");

    jest
      .mocked(getCollectionPhotoPaths)
      .mockResolvedValueOnce(["old-photo.webp"]);
    expect(
      (
        await POST(
          request({
            ...validDraft,
            id: "11111111-1111-4111-8111-111111111111",
          }),
        )
      ).status,
    ).toBe(200);
    expect(deletePortfolioPhotoObjects).toHaveBeenCalledWith([
      "old-photo.webp",
    ]);

    jest.mocked(createPortfolioModels).mockResolvedValueOnce([
      {
        id: createdId,
        name: "New Model",
        slug: "new-model",
        profileUrl: "https://model.example",
      },
    ]);
    jest
      .mocked(savePortfolioCollection)
      .mockRejectedValueOnce(new Error("save error"));
    expect((await POST(request(newDraft))).status).toBe(503);
    expect(deletePortfolioPhotoObjects).toHaveBeenCalledWith(["photo.webp"]);
    expect(deleteUnusedPortfolioModels).toHaveBeenCalledWith({}, [createdId]);
  });

  it("authenticates and validates collection archive changes", async () => {
    const context = {
      params: Promise.resolve({ collectionId: "collection-id" }),
    };
    jest.mocked(getAuthenticatedOperator).mockResolvedValueOnce(null as never);
    expect((await PATCH(request({ archived: true }), context)).status).toBe(
      401,
    );
    jest.mocked(isHarnessFixtureMode).mockReturnValueOnce(true);
    expect((await PATCH(request({ archived: true }), context)).status).toBe(
      503,
    );
    const malformed = {
      json: async () => {
        throw new Error("invalid json");
      },
    } as unknown as Request;
    expect((await PATCH(malformed, context)).status).toBe(400);
    expect((await PATCH(request({ archived: "yes" }), context)).status).toBe(
      400,
    );
    expect((await PATCH(request({ archived: true }), context)).status).toBe(
      200,
    );
    expect(setPortfolioCollectionArchived).toHaveBeenCalledWith(
      {},
      "collection-id",
      true,
    );
    jest
      .mocked(setPortfolioCollectionArchived)
      .mockRejectedValueOnce(new Error("update error"));
    expect((await PATCH(request({ archived: false }), context)).status).toBe(
      503,
    );
  });
});
