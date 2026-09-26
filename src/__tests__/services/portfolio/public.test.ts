jest.mock("server-only", () => ({}));
jest.mock("@/services/harness/mode", () => ({
  isHarnessFixtureMode: jest.fn(),
}));
jest.mock("@/services/portfolio/repository", () => ({
  getPortfolioDatabase: jest.fn(),
  listPortfolioCollections: jest.fn(),
}));

import { getHarnessPortfolioCollections } from "@/services/harness/fixtures";
import { isHarnessFixtureMode } from "@/services/harness/mode";
import {
  getPublishedPortfolioCollection,
  getPublishedPortfolioCollections,
  getPublishedPortfolioForModel,
  getPublishedPortfolioForStyle,
  getPublishedPortfolioModels,
  getPublishedPortfolioStyles,
} from "@/services/portfolio/public";
import {
  getPortfolioDatabase,
  listPortfolioCollections,
} from "@/services/portfolio/repository";

describe("published portfolio queries", () => {
  beforeEach(() => {
    jest.mocked(isHarnessFixtureMode).mockReturnValue(true);
  });

  afterEach(() => jest.clearAllMocks());

  it("uses the fixture library in harness mode", async () => {
    await expect(getPublishedPortfolioCollections()).resolves.toEqual(
      getHarnessPortfolioCollections(),
    );
    expect(listPortfolioCollections).not.toHaveBeenCalled();
  });

  it("loads published data from Supabase outside harness mode", async () => {
    const collections = getHarnessPortfolioCollections();
    jest.mocked(isHarnessFixtureMode).mockReturnValue(false);
    jest.mocked(getPortfolioDatabase).mockReturnValue({} as never);
    jest.mocked(listPortfolioCollections).mockResolvedValue(collections);

    await expect(getPublishedPortfolioCollections()).resolves.toEqual(
      collections,
    );
    expect(listPortfolioCollections).toHaveBeenCalledWith({});
  });

  it("finds a collection by its public slug", async () => {
    await expect(
      getPublishedPortfolioCollection("barcelona-editorial-session"),
    ).resolves.toMatchObject({ name: "Barcelona Editorial Session" });
    await expect(
      getPublishedPortfolioCollection("missing"),
    ).resolves.toBeNull();
  });

  it("finds the published collections belonging to a model", async () => {
    await expect(
      getPublishedPortfolioForModel("harness-model"),
    ).resolves.toMatchObject({
      name: "Harness Model",
      collections: [{ slug: "barcelona-editorial-session" }],
    });
    await expect(getPublishedPortfolioForModel("missing")).resolves.toBeNull();
  });

  it("filters published collections by style", async () => {
    await expect(
      getPublishedPortfolioForStyle("boudoir"),
    ).resolves.toHaveLength(1);
    await expect(
      getPublishedPortfolioForStyle("fashion"),
    ).resolves.toHaveLength(0);
  });

  it("lists unique published models in name order", async () => {
    await expect(getPublishedPortfolioModels()).resolves.toMatchObject([
      { name: "Harness Model" },
    ]);
  });

  it("lists styles represented by published collections", async () => {
    await expect(getPublishedPortfolioStyles()).resolves.toEqual(["boudoir"]);
  });
});
