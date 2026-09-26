import "server-only";

import { createClient } from "@supabase/supabase-js";
import type {
  CollectionDraft,
  PortfolioCollection,
  PortfolioModel,
  PortfolioPhoto,
} from "./types";

const requiredEnvironmentValue = (
  name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY",
): string => {
  const value =
    name === "SUPABASE_URL"
      ? process.env.SUPABASE_URL
      : process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

export const getPortfolioDatabase = () =>
  createClient(
    requiredEnvironmentValue("SUPABASE_URL"),
    requiredEnvironmentValue("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

type Database = ReturnType<typeof getPortfolioDatabase>;

interface CollectionRow {
  id: string;
  name: string;
  slug: string;
  session_date: string;
  location: string;
  style: PortfolioCollection["style"];
  lingerie_brand: string | null;
  archived_at: string | null;
}

interface PhotoRow {
  id: string;
  collection_id: string;
  drive_file_id: string;
  object_path: string;
  public_url: string;
  alt_text: string;
  position: number;
}

interface PortfolioModelRow {
  id: string;
  name: string;
  slug: string;
  profile_url: string;
}

interface CollectionModelRow {
  collection_id: string;
  model: PortfolioModelRow | PortfolioModelRow[] | null;
}

const toPortfolioModel = (
  row: PortfolioModelRow | null,
): PortfolioModel | null =>
  row
    ? {
        id: row.id,
        name: row.name,
        slug: row.slug,
        profileUrl: row.profile_url,
      }
    : null;

const toPortfolioPhoto = (row: PhotoRow): PortfolioPhoto => ({
  id: row.id,
  driveFileId: row.drive_file_id,
  objectPath: row.object_path,
  publicUrl: row.public_url,
  altText: row.alt_text,
  position: row.position,
});

const fetchCollectionRows = async (
  database: Database,
  options: { includeArchived?: boolean; style?: PortfolioCollection["style"] },
): Promise<CollectionRow[]> => {
  const selectedQuery = database
    .from("portfolio_collections")
    .select(
      "id,name,slug,session_date,location,style,lingerie_brand,archived_at",
    );
  const activeQuery = options.includeArchived
    ? selectedQuery
    : selectedQuery.is("archived_at", null);
  const filteredQuery = options.style
    ? activeQuery.eq("style", options.style)
    : activeQuery;
  const { data, error } = await filteredQuery
    .order("session_date", { ascending: false })
    .order("name", { ascending: true });
  if (error) {
    throw error;
  }
  return (data ?? []) as CollectionRow[];
};

const fetchCollectionRelations = async (
  database: Database,
  rows: CollectionRow[],
) => {
  const collectionIds = rows.map((row) => row.id);
  const [photoResult, modelResult] = await Promise.all([
    database
      .from("portfolio_collection_photos")
      .select(
        "id,collection_id,drive_file_id,object_path,public_url,alt_text,position",
      )
      .in("collection_id", collectionIds)
      .order("position"),
    database
      .from("portfolio_collection_models")
      .select("collection_id,model:portfolio_models(id,name,slug,profile_url)")
      .in("collection_id", collectionIds),
  ]);
  if (photoResult.error) throw photoResult.error;
  if (modelResult.error) throw modelResult.error;
  return {
    photos: (photoResult.data ?? []) as PhotoRow[],
    models: (modelResult.data ?? []) as CollectionModelRow[],
  };
};

const mapCollectionRows = (
  rows: CollectionRow[],
  photos: PhotoRow[],
  associations: CollectionModelRow[],
): PortfolioCollection[] => {
  const photosByCollection = new Map<string, PortfolioPhoto[]>();
  for (const row of photos) {
    const grouped = photosByCollection.get(row.collection_id) ?? [];
    grouped.push(toPortfolioPhoto(row));
    photosByCollection.set(row.collection_id, grouped);
  }
  const modelsByCollection = new Map<string, PortfolioModel[]>();
  for (const row of associations) {
    const model = toPortfolioModel(
      Array.isArray(row.model) ? (row.model[0] ?? null) : row.model,
    );
    if (!model) continue;
    const grouped = modelsByCollection.get(row.collection_id) ?? [];
    grouped.push(model);
    modelsByCollection.set(row.collection_id, grouped);
  }
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    sessionDate: row.session_date,
    location: row.location,
    style: row.style,
    lingerieBrand: row.lingerie_brand,
    archivedAt: row.archived_at,
    photos: photosByCollection.get(row.id) ?? [],
    models: modelsByCollection.get(row.id) ?? [],
  }));
};

export const listPortfolioCollections = async (
  database: Database,
  options: {
    includeArchived?: boolean;
    style?: PortfolioCollection["style"];
  } = {},
): Promise<PortfolioCollection[]> => {
  const rows = await fetchCollectionRows(database, options);
  if (rows.length === 0) {
    return [];
  }
  const related = await fetchCollectionRelations(database, rows);
  return mapCollectionRows(rows, related.photos, related.models);
};

export const listPortfolioModels = async (
  database: Database,
): Promise<PortfolioModel[]> => {
  const { data, error } = await database
    .from("portfolio_models")
    .select("id,name,slug,profile_url")
    .order("name");
  if (error) {
    throw error;
  }
  return (
    (data ?? []) as Array<{
      id: string;
      name: string;
      slug: string;
      profile_url: string;
    }>
  ).map((model) => ({
    id: model.id,
    name: model.name,
    slug: model.slug,
    profileUrl: model.profile_url,
  }));
};

export const createPortfolioModels = async (
  database: Database,
  models: Array<{ name: string; slug: string; profileUrl: string }>,
): Promise<PortfolioModel[]> => {
  if (models.length === 0) {
    return [];
  }
  const { data, error } = await database
    .from("portfolio_models")
    .insert(
      models.map((model) => ({
        name: model.name,
        slug: model.slug,
        profile_url: model.profileUrl,
      })),
    )
    .select("id,name,slug,profile_url");
  if (error) {
    throw error;
  }
  return (
    (data ?? []) as Array<{
      id: string;
      name: string;
      slug: string;
      profile_url: string;
    }>
  ).map((model) => ({
    id: model.id,
    name: model.name,
    slug: model.slug,
    profileUrl: model.profile_url,
  }));
};

export const deleteUnusedPortfolioModels = async (
  database: Database,
  modelIds: string[],
): Promise<void> => {
  if (modelIds.length === 0) {
    return;
  }
  const { data: associations, error: associationError } = await database
    .from("portfolio_collection_models")
    .select("model_id")
    .in("model_id", modelIds);
  if (associationError) {
    throw associationError;
  }
  const associatedIds = new Set(
    ((associations ?? []) as Array<{ model_id: string }>).map(
      (association) => association.model_id,
    ),
  );
  const unusedIds = modelIds.filter((modelId) => !associatedIds.has(modelId));
  if (unusedIds.length === 0) {
    return;
  }
  const { error } = await database
    .from("portfolio_models")
    .delete()
    .in("id", unusedIds);
  if (error) {
    throw error;
  }
};

export const getCollectionPhotoPaths = async (
  database: Database,
  collectionId: string,
): Promise<string[]> => {
  const { data, error } = await database
    .from("portfolio_collection_photos")
    .select("object_path")
    .eq("collection_id", collectionId);
  if (error) {
    throw error;
  }
  return ((data ?? []) as Array<{ object_path: string }>).map(
    (photo) => photo.object_path,
  );
};

export const savePortfolioCollection = async (
  database: Database,
  collection: CollectionDraft,
  models: Array<Pick<PortfolioModel, "id">>,
  photos: Array<{
    driveFileId: string;
    objectPath: string;
    publicUrl: string;
    altText: string;
    position: number;
  }>,
): Promise<string> => {
  const result = (await database.rpc("save_portfolio_collection", {
    p_id: collection.id ?? null,
    p_name: collection.name,
    p_slug: collection.slug,
    p_session_date: collection.sessionDate,
    p_location: collection.location,
    p_style: collection.style,
    p_lingerie_brand: collection.lingerieBrand || null,
    p_model_ids: models.map((model) => model.id),
    p_photos: photos.map((photo) => ({
      drive_file_id: photo.driveFileId,
      object_path: photo.objectPath,
      public_url: photo.publicUrl,
      alt_text: photo.altText,
      position: photo.position,
    })),
  })) as { data: unknown; error: Error | null };
  const { data, error } = result;
  if (error) {
    throw error;
  }
  if (typeof data !== "string") {
    throw new Error("The portfolio collection was not saved");
  }
  return data;
};

export const setPortfolioCollectionArchived = async (
  database: Database,
  collectionId: string,
  archived: boolean,
): Promise<void> => {
  const { error } = await database
    .from("portfolio_collections")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", collectionId);
  if (error) {
    throw error;
  }
};

export const getPublicCollectionBySlug = async (
  database: Database,
  slug: string,
): Promise<PortfolioCollection | null> => {
  const collections = await listPortfolioCollections(database);
  return collections.find((collection) => collection.slug === slug) ?? null;
};

export const getPublicCollectionsForModel = async (
  database: Database,
  modelSlug: string,
): Promise<{
  model: PortfolioModel;
  collections: PortfolioCollection[];
} | null> => {
  const models = await listPortfolioModels(database);
  const model = models.find((candidate) => candidate.slug === modelSlug);
  if (!model) {
    return null;
  }
  const collections = await listPortfolioCollections(database);
  const matching = collections.filter((collection) =>
    collection.models.some(
      (collectionModel) => collectionModel.id === model.id,
    ),
  );
  return matching.length > 0 ? { model, collections: matching } : null;
};

export const getPublicCollectionsForStyle = async (
  database: Database,
  style: PortfolioCollection["style"],
): Promise<PortfolioCollection[]> =>
  listPortfolioCollections(database, { style });
