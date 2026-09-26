jest.mock("server-only", () => ({}));

import {
  getPublicCollectionBySlug,
  getPublicCollectionsForModel,
  getPublicCollectionsForStyle,
} from "@/services/portfolio/repository";

const row = {
  id: "collection-id",
  name: "Collection",
  slug: "collection",
  session_date: "2026-09-26",
  location: "Barcelona",
  style: "portrait",
  lingerie_brand: null,
  archived_at: null,
};
const modelRow = {
  id: "model-id",
  name: "Model",
  slug: "model",
  profile_url: "https://example.com/model",
};

const createDatabase = (
  responses: Array<{ table: string; data: unknown; error?: Error | null }>,
) => ({
  from: jest.fn((table: string) => {
    const response = responses.find((candidate) => candidate.table === table);
    const result = {
      data: response?.data ?? [],
      error: response?.error ?? null,
    };
    const query: Record<string, unknown> = {};
    const chain = () => query;
    ["select", "is", "eq", "order", "in"].forEach((name) => {
      Object.defineProperty(query, name, { value: chain, enumerable: true });
    });
    query.then = (
      resolve: (value: unknown) => unknown,
      reject: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject);
    return query;
  }),
});

describe("portfolio public repository queries", () => {
  it("finds collections by slug and returns null when absent", async () => {
    const database = createDatabase([
      { table: "portfolio_collections", data: [row] },
      { table: "portfolio_collection_photos", data: [] },
      { table: "portfolio_collection_models", data: [] },
    ]);
    await expect(
      getPublicCollectionBySlug(database as never, "collection"),
    ).resolves.toMatchObject({ slug: "collection" });

    const missingDatabase = createDatabase([
      { table: "portfolio_collections", data: [] },
    ]);
    await expect(
      getPublicCollectionBySlug(missingDatabase as never, "missing"),
    ).resolves.toBeNull();
  });

  it("finds a model with matching collections and returns null for unmatched models or sessions", async () => {
    const missingDatabase = createDatabase([
      { table: "portfolio_models", data: [] },
    ]);
    await expect(
      getPublicCollectionsForModel(missingDatabase as never, "missing"),
    ).resolves.toBeNull();

    const unusedDatabase = createDatabase([
      { table: "portfolio_models", data: [modelRow] },
      { table: "portfolio_collections", data: [row] },
      { table: "portfolio_collection_photos", data: [] },
      { table: "portfolio_collection_models", data: [] },
    ]);
    await expect(
      getPublicCollectionsForModel(unusedDatabase as never, "model"),
    ).resolves.toBeNull();

    const matchingDatabase = createDatabase([
      { table: "portfolio_models", data: [modelRow] },
      { table: "portfolio_collections", data: [row] },
      { table: "portfolio_collection_photos", data: [] },
      {
        table: "portfolio_collection_models",
        data: [{ collection_id: "collection-id", model: modelRow }],
      },
    ]);
    await expect(
      getPublicCollectionsForModel(matchingDatabase as never, "model"),
    ).resolves.toMatchObject({
      model: { id: "model-id" },
      collections: [expect.objectContaining({ slug: "collection" })],
    });
  });

  it("filters the published collections by style", async () => {
    const database = createDatabase([
      { table: "portfolio_collections", data: [row] },
      { table: "portfolio_collection_photos", data: [] },
      { table: "portfolio_collection_models", data: [] },
    ]);
    await expect(
      getPublicCollectionsForStyle(database as never, "portrait"),
    ).resolves.toMatchObject([expect.objectContaining({ style: "portrait" })]);
  });
});
