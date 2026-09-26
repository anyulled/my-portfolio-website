jest.mock("next/server", () => ({ connection: jest.fn() }));
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));
jest.mock("next-intl/server", () => ({
  getLocale: jest.fn().mockResolvedValue("en"),
  getTranslations: jest
    .fn()
    .mockResolvedValue((key: string, values?: Record<string, string>) =>
      values ? `${key}:${Object.values(values).join(",")}` : key,
    ),
}));
jest.mock("@/services/portfolio/public", () => ({
  getPublishedPortfolioCollections: jest.fn(),
  getPublishedPortfolioCollection: jest.fn(),
  getPublishedPortfolioForModel: jest.fn(),
  getPublishedPortfolioForStyle: jest.fn(),
  getPublishedPortfolioModels: jest.fn(),
  getPublishedPortfolioStyles: jest.fn(),
}));

import { render, screen } from "@testing-library/react";
import PortfolioPage, {
  generateMetadata as portfolioMetadata,
} from "@/app/portfolio/page";
import PortfolioCollectionPage, {
  generateMetadata as collectionMetadata,
} from "@/app/portfolio/[collectionSlug]/page";
import ModelsPage, {
  generateMetadata as modelsMetadata,
} from "@/app/models/page";
import ModelPage, {
  generateMetadata as modelMetadata,
} from "@/app/models/[modelName]/page";
import StylesPage from "@/app/styles/page";
import StylePage, {
  generateMetadata as styleMetadata,
} from "@/app/styles/[styleName]/page";
import { getHarnessPortfolioCollections } from "@/services/harness/fixtures";
import {
  getPublishedPortfolioCollection,
  getPublishedPortfolioCollections,
  getPublishedPortfolioForModel,
  getPublishedPortfolioForStyle,
  getPublishedPortfolioModels,
  getPublishedPortfolioStyles,
} from "@/services/portfolio/public";
import { notFound } from "next/navigation";

const collections = getHarnessPortfolioCollections();
const model = collections[0].models[0];

describe("public portfolio pages", () => {
  beforeEach(() => {
    jest
      .mocked(getPublishedPortfolioCollections)
      .mockResolvedValue(collections);
    jest
      .mocked(getPublishedPortfolioCollection)
      .mockResolvedValue(collections[0]);
    jest.mocked(getPublishedPortfolioForModel).mockResolvedValue({
      name: model.name,
      profileUrl: model.profileUrl,
      collections,
    });
    jest.mocked(getPublishedPortfolioForStyle).mockResolvedValue(collections);
    jest.mocked(getPublishedPortfolioModels).mockResolvedValue([model]);
    jest.mocked(getPublishedPortfolioStyles).mockResolvedValue(["boudoir"]);
  });

  afterEach(() => jest.clearAllMocks());

  it("renders collection listing and its empty state", async () => {
    const listing = await PortfolioPage();
    render(listing);
    expect(screen.getByRole("heading", { name: "title" })).toBeInTheDocument();
    jest.mocked(getPublishedPortfolioCollections).mockResolvedValueOnce([]);
    render(await PortfolioPage());
    expect(screen.getByText("no_collections")).toBeInTheDocument();
    expect(await portfolioMetadata()).toMatchObject({
      description: "description",
      openGraph: { type: "website" },
      twitter: { card: "summary_large_image" },
    });
  });

  it("renders a collection, metadata, and missing collection metadata", async () => {
    render(
      await PortfolioCollectionPage({
        params: Promise.resolve({ collectionSlug: collections[0].slug }),
      }),
    );
    expect(screen.getByText(collections[0].name)).toBeInTheDocument();
    expect(
      await collectionMetadata({
        params: Promise.resolve({ collectionSlug: collections[0].slug }),
      }),
    ).toMatchObject({
      title: collections[0].name,
      openGraph: { type: "article" },
    });
    jest.mocked(getPublishedPortfolioCollection).mockResolvedValueOnce(null);
    expect(
      await collectionMetadata({
        params: Promise.resolve({ collectionSlug: "missing" }),
      }),
    ).toEqual({});
    jest.mocked(getPublishedPortfolioCollection).mockResolvedValueOnce(null);
    await expect(
      PortfolioCollectionPage({
        params: Promise.resolve({ collectionSlug: "missing" }),
      }),
    ).rejects.toThrow("NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("renders model directory and model detail metadata", async () => {
    render(await ModelsPage());
    expect(
      screen.getByRole("heading", { name: "models_title" }),
    ).toBeInTheDocument();
    expect(screen.getByText(model.profileUrl)).toBeInTheDocument();
    expect(await modelsMetadata()).toMatchObject({
      description: "models_description",
      twitter: { card: "summary_large_image" },
    });
    render(
      await ModelPage({ params: Promise.resolve({ modelName: model.slug }) }),
    );
    expect(
      screen.getByRole("heading", { name: model.name, level: 1 }),
    ).toBeInTheDocument();
    expect(
      await modelMetadata({
        params: Promise.resolve({ modelName: model.slug }),
      }),
    ).toMatchObject({
      title: model.name,
      description: `model_description:${model.name}`,
    });
    jest.mocked(getPublishedPortfolioForModel).mockResolvedValueOnce(null);
    expect(
      await modelMetadata({
        params: Promise.resolve({ modelName: "missing" }),
      }),
    ).toEqual({});
    jest.mocked(getPublishedPortfolioForModel).mockResolvedValueOnce(null);
    await expect(
      ModelPage({ params: Promise.resolve({ modelName: "missing" }) }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("renders model and style entries without cover photos or without models", async () => {
    jest
      .mocked(getPublishedPortfolioCollections)
      .mockResolvedValueOnce([{ ...collections[0], photos: [] }]);
    render(await ModelsPage());
    expect(screen.getByRole("link", { name: model.name })).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: model.name }),
    ).not.toBeInTheDocument();

    jest.mocked(getPublishedPortfolioModels).mockResolvedValueOnce([]);
    render(await ModelsPage());
    expect(screen.getAllByText("no_collections").length).toBeGreaterThan(0);

    jest
      .mocked(getPublishedPortfolioCollections)
      .mockResolvedValueOnce([{ ...collections[0], photos: [] }]);
    render(await StylesPage());
    expect(screen.getByRole("link", { name: /boudoir/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "boudoir" }),
    ).not.toBeInTheDocument();
  });

  it("renders active styles and style collections, rejecting invalid or empty styles", async () => {
    render(await StylesPage());
    expect(
      screen.getByRole("heading", { name: "styles_title" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /boudoir/ })).toHaveAttribute(
      "href",
      "/styles/boudoir",
    );
    jest.mocked(getPublishedPortfolioStyles).mockResolvedValueOnce([]);
    render(await StylesPage());
    expect(screen.getByText("no_collections")).toBeInTheDocument();
    render(
      await StylePage({ params: Promise.resolve({ styleName: "boudoir" }) }),
    );
    expect(
      screen.getByRole("heading", { name: "boudoir" }),
    ).toBeInTheDocument();
    expect(
      await styleMetadata({
        params: Promise.resolve({ styleName: "boudoir" }),
      }),
    ).toMatchObject({
      title: "boudoir",
      twitter: { card: "summary_large_image" },
    });
    await expect(
      StylePage({ params: Promise.resolve({ styleName: "unknown" }) }),
    ).rejects.toThrow("NOT_FOUND");
    jest.mocked(getPublishedPortfolioForStyle).mockResolvedValueOnce([]);
    await expect(
      StylePage({ params: Promise.resolve({ styleName: "boudoir" }) }),
    ).rejects.toThrow("NOT_FOUND");
    expect(
      await styleMetadata({
        params: Promise.resolve({ styleName: "unknown" }),
      }),
    ).toEqual({});
  });
});
