jest.mock("server-only", () => ({}));
jest.mock("@supabase/supabase-js", () => ({ createClient: jest.fn() }));

import { createClient } from "@supabase/supabase-js";
import {
  createPortfolioModels,
  deleteUnusedPortfolioModels,
  getCollectionPhotoPaths,
  getPortfolioDatabase,
  listPortfolioCollections,
  listPortfolioModels,
  savePortfolioCollection,
  setPortfolioCollectionArchived,
} from "@/services/portfolio/repository";
import type { CollectionDraft } from "@/services/portfolio/types";

const mockCreateClient = jest.mocked(createClient);
const queryResults = new Map<
  string,
  Array<{ data: unknown; error: Error | null }>
>();
const mockFromCalls: Array<{
  table: string;
  methods: Array<[string, unknown[]]>;
}> = [];
const mockRpc = jest.fn();

const resultFor = (table: string) =>
  queryResults.get(table)?.shift() ?? { data: [], error: null };

const mockFrom = jest.fn((table: string) => {
  const call = { table, methods: [] as Array<[string, unknown[]]> };
  mockFromCalls.push(call);
  const result = resultFor(table);
  const query: Record<string, unknown> = {};
  const chainMethod =
    (name: string) =>
    (...args: unknown[]) => {
      call.methods.push([name, args]);
      return query;
    };
  ["select", "is", "eq", "order", "in", "insert", "update", "delete"].forEach(
    (name) => {
      Object.defineProperty(query, name, {
        value: chainMethod(name),
        enumerable: true,
      });
    },
  );
  query.then = (
    resolve: (value: unknown) => unknown,
    reject: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve, reject);
  return query;
});

const database = { from: mockFrom, rpc: mockRpc };
const portfolioDraft = {
  name: "Collection",
  slug: "collection",
  sessionDate: "2026-09-26",
  location: "Barcelona",
  style: "portrait",
  lingerieBrand: "",
  modelIds: [],
  newModels: [],
  driveImages: [],
} as CollectionDraft;

const collectionRow = {
  id: "collection-id",
  name: "Collection",
  slug: "collection",
  session_date: "2026-09-26",
  location: "Barcelona",
  style: "portrait",
  lingerie_brand: null,
  archived_at: null,
};

describe("portfolio Supabase repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryResults.clear();
    mockFromCalls.length = 0;
    mockCreateClient.mockReturnValue(database as never);
    mockRpc.mockResolvedValue({ data: "collection-id", error: null });
    process.env.SUPABASE_URL = "https://supabase.example";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
  });

  it("requires database credentials and creates a nonpersistent service client", () => {
    delete process.env.SUPABASE_URL;
    expect(() => getPortfolioDatabase()).toThrow("SUPABASE_URL is required");
    process.env.SUPABASE_URL = "https://supabase.example";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => getPortfolioDatabase()).toThrow(
      "SUPABASE_SERVICE_ROLE_KEY is required",
    );
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    expect(getPortfolioDatabase()).toBe(database);
    expect(createClient).toHaveBeenCalledWith(
      "https://supabase.example",
      "service-key",
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );
  });

  it("lists empty and related collections with photos and model relation variants", async () => {
    queryResults.set("portfolio_collections", [{ data: [], error: null }]);
    await expect(listPortfolioCollections(database as never)).resolves.toEqual(
      [],
    );
    expect(mockFromCalls).toHaveLength(1);

    queryResults.set("portfolio_collections", [
      { data: [collectionRow], error: null },
    ]);
    queryResults.set("portfolio_collection_photos", [
      {
        data: [
          {
            id: "photo",
            collection_id: "collection-id",
            drive_file_id: "drive-id",
            object_path: "photo.webp",
            public_url: "https://example.com/photo.webp",
            alt_text: "Photo",
            position: 1,
          },
        ],
        error: null,
      },
    ]);
    queryResults.set("portfolio_collection_models", [
      {
        data: [
          {
            collection_id: "collection-id",
            model: {
              id: "model-id",
              name: "Model",
              slug: "model",
              profile_url: "https://example.com/model",
            },
          },
          {
            collection_id: "collection-id",
            model: [
              {
                id: "model-two",
                name: "Model Two",
                slug: "model-two",
                profile_url: "https://example.com/two",
              },
            ],
          },
          { collection_id: "collection-id", model: null },
        ],
        error: null,
      },
    ]);
    await expect(
      listPortfolioCollections(database as never, {
        includeArchived: true,
        style: "portrait",
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "collection-id",
        lingerieBrand: null,
        photos: [
          expect.objectContaining({
            id: "photo",
            driveFileId: "drive-id",
            position: 1,
          }),
        ],
        models: [
          expect.objectContaining({ id: "model-id" }),
          expect.objectContaining({ id: "model-two" }),
        ],
      }),
    ]);
    expect(mockFromCalls.at(-3)?.methods).toContainEqual([
      "eq",
      ["style", "portrait"],
    ]);
  });

  it("throws on collection or relation query failures", async () => {
    queryResults.set("portfolio_collections", [
      { data: null, error: new Error("collection failure") },
    ]);
    await expect(listPortfolioCollections(database as never)).rejects.toThrow(
      "collection failure",
    );
    queryResults.set("portfolio_collections", [
      { data: [collectionRow], error: null },
    ]);
    queryResults.set("portfolio_collection_photos", [
      { data: null, error: new Error("photo failure") },
    ]);
    queryResults.set("portfolio_collection_models", [
      { data: [], error: null },
    ]);
    await expect(listPortfolioCollections(database as never)).rejects.toThrow(
      "photo failure",
    );
    queryResults.set("portfolio_collections", [
      { data: [collectionRow], error: null },
    ]);
    queryResults.set("portfolio_collection_photos", [
      { data: [], error: null },
    ]);
    queryResults.set("portfolio_collection_models", [
      { data: null, error: new Error("model failure") },
    ]);
    await expect(listPortfolioCollections(database as never)).rejects.toThrow(
      "model failure",
    );
  });

  it("lists, creates, and conditionally deletes unused models", async () => {
    queryResults.set("portfolio_models", [
      {
        data: [
          {
            id: "model-id",
            name: "Model",
            slug: "model",
            profile_url: "https://example.com/model",
          },
        ],
        error: null,
      },
    ]);
    await expect(listPortfolioModels(database as never)).resolves.toEqual([
      {
        id: "model-id",
        name: "Model",
        slug: "model",
        profileUrl: "https://example.com/model",
      },
    ]);
    queryResults.set("portfolio_models", [
      {
        data: [
          {
            id: "model-id",
            name: "Model",
            slug: "model",
            profile_url: "https://example.com/model",
          },
        ],
        error: null,
      },
    ]);
    await expect(
      createPortfolioModels(database as never, [
        {
          name: "Model",
          slug: "model",
          profileUrl: "https://example.com/model",
        },
      ]),
    ).resolves.toHaveLength(1);
    await expect(createPortfolioModels(database as never, [])).resolves.toEqual(
      [],
    );

    await deleteUnusedPortfolioModels(database as never, []);
    queryResults.set("portfolio_collection_models", [
      { data: [{ model_id: "used" }], error: null },
    ]);
    await deleteUnusedPortfolioModels(database as never, ["used"]);
    queryResults.set("portfolio_collection_models", [
      { data: [{ model_id: "used" }], error: null },
    ]);
    queryResults.set("portfolio_models", [{ data: null, error: null }]);
    await deleteUnusedPortfolioModels(database as never, ["used", "unused"]);
    expect(mockFromCalls.at(-1)?.methods).toContainEqual([
      "in",
      ["id", ["unused"]],
    ]);
  });

  it("loads photo paths, saves collection RPC payloads, and archives records", async () => {
    queryResults.set("portfolio_collection_photos", [
      {
        data: [{ object_path: "one.webp" }, { object_path: "two.webp" }],
        error: null,
      },
    ]);
    await expect(
      getCollectionPhotoPaths(database as never, "collection-id"),
    ).resolves.toEqual(["one.webp", "two.webp"]);
    queryResults.set("portfolio_collection_photos", [
      { data: null, error: new Error("photos unavailable") },
    ]);
    await expect(
      getCollectionPhotoPaths(database as never, "collection-id"),
    ).rejects.toThrow("photos unavailable");

    await expect(
      savePortfolioCollection(
        database as never,
        portfolioDraft,
        [{ id: "model-id" }],
        [
          {
            driveFileId: "drive-id",
            objectPath: "photo.webp",
            publicUrl: "https://example.com/photo.webp",
            altText: "Photo",
            position: 0,
          },
        ],
      ),
    ).resolves.toBe("collection-id");
    expect(mockRpc).toHaveBeenCalledWith(
      "save_portfolio_collection",
      expect.objectContaining({
        p_id: null,
        p_lingerie_brand: null,
        p_model_ids: ["model-id"],
        p_photos: [expect.objectContaining({ drive_file_id: "drive-id" })],
      }),
    );
    mockRpc.mockResolvedValueOnce({ data: null, error: null });
    await expect(
      savePortfolioCollection(database as never, portfolioDraft, [], []),
    ).rejects.toThrow("was not saved");
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: new Error("rpc failure"),
    });
    await expect(
      savePortfolioCollection(database as never, portfolioDraft, [], []),
    ).rejects.toThrow("rpc failure");

    queryResults.set("portfolio_collections", [{ data: null, error: null }]);
    await setPortfolioCollectionArchived(
      database as never,
      "collection-id",
      true,
    );
    expect(mockFromCalls.at(-1)?.methods).toContainEqual([
      "eq",
      ["id", "collection-id"],
    ]);
    queryResults.set("portfolio_collections", [
      { data: null, error: new Error("archive failure") },
    ]);
    await expect(
      setPortfolioCollectionArchived(database as never, "collection-id", false),
    ).rejects.toThrow("archive failure");
  });
});
