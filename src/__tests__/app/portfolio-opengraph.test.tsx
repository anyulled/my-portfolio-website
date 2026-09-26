jest.mock("next/server", () => ({ connection: jest.fn() }));
jest.mock("next/og", () => ({
  ImageResponse: jest.fn((element, options) => ({ element, options })),
}));
jest.mock("@/lib/openGraphImage", () => ({
  fallbackOpenGraphImageUrl: "https://example.com/fallback.jpg",
}));
jest.mock("@/services/portfolio/public", () => ({
  getPublishedPortfolioCollections: jest.fn(),
  getPublishedPortfolioCollection: jest.fn(),
  getPublishedPortfolioForModel: jest.fn(),
  getPublishedPortfolioForStyle: jest.fn(),
}));

import type { ReactElement } from "react";
import PortfolioOpenGraphImage from "@/app/portfolio/opengraph-image";
import CollectionOpenGraphImage from "@/app/portfolio/[collectionSlug]/opengraph-image";
import ModelsOpenGraphImage from "@/app/models/opengraph-image";
import ModelOpenGraphImage from "@/app/models/[modelName]/opengraph-image";
import StylesOpenGraphImage from "@/app/styles/opengraph-image";
import StyleOpenGraphImage from "@/app/styles/[styleName]/opengraph-image";
import {
  getPublishedPortfolioCollection,
  getPublishedPortfolioCollections,
  getPublishedPortfolioForModel,
  getPublishedPortfolioForStyle,
} from "@/services/portfolio/public";
import { ImageResponse } from "next/og";

const fallbackOpenGraphImageUrl = "https://example.com/fallback.jpg";

const collection = {
  name: "Editorial",
  photos: [{ publicUrl: "https://example.com/editorial.webp" }],
};

const getImageInput = (response: unknown) =>
  (
    response as {
      element: ReactElement<{
        children: Array<ReactElement<{ src: string }>>;
      }>;
    }
  ).element.props.children[0].props.src;

describe("portfolio Open Graph image routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(getPublishedPortfolioCollections)
      .mockResolvedValue([collection] as never);
    jest
      .mocked(getPublishedPortfolioCollection)
      .mockResolvedValue(collection as never);
    jest.mocked(getPublishedPortfolioForModel).mockResolvedValue({
      name: "Model",
      collections: [collection],
    } as never);
    jest
      .mocked(getPublishedPortfolioForStyle)
      .mockResolvedValue([collection] as never);
  });

  it("uses the first published photo for portfolio, model, and style directory cards", async () => {
    expect(getImageInput(await PortfolioOpenGraphImage())).toBe(
      collection.photos[0].publicUrl,
    );
    expect(getImageInput(await ModelsOpenGraphImage())).toBe(
      collection.photos[0].publicUrl,
    );
    expect(getImageInput(await StylesOpenGraphImage())).toBe(
      collection.photos[0].publicUrl,
    );
    expect(ImageResponse).toHaveBeenCalledTimes(3);
  });

  it("uses collection, model, and style detail images when available", async () => {
    expect(
      getImageInput(
        await CollectionOpenGraphImage({
          params: Promise.resolve({ collectionSlug: "editorial" }),
        }),
      ),
    ).toBe(collection.photos[0].publicUrl);
    expect(
      getImageInput(
        await ModelOpenGraphImage({
          params: Promise.resolve({ modelName: "model" }),
        }),
      ),
    ).toBe(collection.photos[0].publicUrl);
    expect(
      getImageInput(
        await StyleOpenGraphImage({
          params: Promise.resolve({ styleName: "boudoir" }),
        }),
      ),
    ).toBe(collection.photos[0].publicUrl);
    expect(getPublishedPortfolioForStyle).toHaveBeenCalledWith("boudoir");
  });

  it("falls back to the default image when a route has no published photo", async () => {
    jest
      .mocked(getPublishedPortfolioCollections)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    expect(getImageInput(await PortfolioOpenGraphImage())).toBe(
      fallbackOpenGraphImageUrl,
    );
    expect(getImageInput(await ModelsOpenGraphImage())).toBe(
      fallbackOpenGraphImageUrl,
    );
    expect(getImageInput(await StylesOpenGraphImage())).toBe(
      fallbackOpenGraphImageUrl,
    );
    jest
      .mocked(getPublishedPortfolioCollection)
      .mockResolvedValueOnce(null as never);
    jest.mocked(getPublishedPortfolioForModel).mockResolvedValueOnce(null);
    jest.mocked(getPublishedPortfolioForStyle).mockResolvedValueOnce([]);
    expect(
      getImageInput(
        await CollectionOpenGraphImage({
          params: Promise.resolve({ collectionSlug: "missing" }),
        }),
      ),
    ).toBe(fallbackOpenGraphImageUrl);
    expect(
      getImageInput(
        await ModelOpenGraphImage({
          params: Promise.resolve({ modelName: "missing" }),
        }),
      ),
    ).toBe(fallbackOpenGraphImageUrl);
    expect(
      getImageInput(
        await StyleOpenGraphImage({
          params: Promise.resolve({ styleName: "unknown" }),
        }),
      ),
    ).toBe(fallbackOpenGraphImageUrl);
    expect(getPublishedPortfolioForStyle).not.toHaveBeenCalled();
  });
});
