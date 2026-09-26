import "server-only";

import { isHarnessFixtureMode } from "@/services/harness/mode";
import { getHarnessPortfolioCollections } from "@/services/harness/fixtures";
import { getPortfolioDatabase, listPortfolioCollections } from "./repository";
import type { PortfolioCollection, PortfolioStyle } from "./types";

export const getPublishedPortfolioCollections = async (): Promise<
  PortfolioCollection[]
> => {
  if (isHarnessFixtureMode()) {
    return getHarnessPortfolioCollections();
  }
  return listPortfolioCollections(getPortfolioDatabase());
};

export const getPublishedPortfolioCollection = async (
  slug: string,
): Promise<PortfolioCollection | null> => {
  const collections = await getPublishedPortfolioCollections();
  return collections.find((collection) => collection.slug === slug) ?? null;
};

export const getPublishedPortfolioForModel = async (
  slug: string,
): Promise<{
  name: string;
  profileUrl: string;
  collections: PortfolioCollection[];
} | null> => {
  const collections = await getPublishedPortfolioCollections();
  const model = collections
    .flatMap((collection) => collection.models)
    .find((candidate) => candidate.slug === slug);
  if (!model) {
    return null;
  }
  return {
    name: model.name,
    profileUrl: model.profileUrl,
    collections: collections.filter((collection) =>
      collection.models.some((candidate) => candidate.id === model.id),
    ),
  };
};

export const getPublishedPortfolioForStyle = async (
  style: PortfolioStyle,
): Promise<PortfolioCollection[]> =>
  (await getPublishedPortfolioCollections()).filter(
    (collection) => collection.style === style,
  );

export const getPublishedPortfolioModels = async () => {
  const collections = await getPublishedPortfolioCollections();
  return Array.from(
    new Map(
      collections.flatMap((collection) =>
        collection.models.map((model) => [model.id, model] as const),
      ),
    ).values(),
  ).sort((first, second) => first.name.localeCompare(second.name));
};

export const getPublishedPortfolioStyles = async () => {
  const collections = await getPublishedPortfolioCollections();
  return Array.from(new Set(collections.map((collection) => collection.style)));
};
