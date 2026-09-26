import { useEffect, useMemo, useState } from "react";
import type {
  CollectionDraft,
  DriveEntry,
  DriveFolderPage,
  PortfolioCollection,
  PortfolioModel,
} from "@/services/portfolio/types";

interface PortfolioManagerProps {
  collections: PortfolioCollection[];
  models: PortfolioModel[];
}

interface NewModelDraft {
  name: string;
  profileUrl: string;
}

const emptyDraft = (): CollectionDraft => ({
  name: "",
  slug: "",
  sessionDate: new Date().toISOString().slice(0, 10),
  location: "",
  style: "portrait",
  lingerieBrand: "",
  modelIds: [],
  newModels: [],
  driveImages: [],
});

const getJson = async <T>(response: Response): Promise<T> => {
  const result: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof result === "object" && result !== null && "message" in result
        ? String(result.message)
        : "The request could not be completed.";
    throw new Error(message);
  }
  return result as T;
};

export const usePortfolioManager = ({
  collections: initialCollections,
  models: initialModels,
}: PortfolioManagerProps) => {
  const [collections, setCollections] = useState(initialCollections);
  const [models, setModels] = useState(initialModels);
  const [draft, setDraft] = useState<CollectionDraft>(emptyDraft);
  const [newModel, setNewModel] = useState<NewModelDraft>({
    name: "",
    profileUrl: "",
  });
  const [folderPage, setFolderPage] = useState<DriveFolderPage | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [folderTrail, setFolderTrail] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loadingFolder, setLoadingFolder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const editing = Boolean(draft.id);
  const selectedIds = useMemo(
    () => new Set(draft.driveImages.map((image) => image.id)),
    [draft.driveImages],
  );

  const loadFolder = async (
    folderId?: string,
    pageToken?: string,
    append = false,
  ) => {
    setLoadingFolder(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (folderId) query.set("folderId", folderId);
      if (pageToken) query.set("pageToken", pageToken);
      const suffix = query.size > 0 ? `?${query.toString()}` : "";
      const page = await getJson<DriveFolderPage>(
        await fetch(`/api/admin/portfolio/drive${suffix}`),
      );
      setFolderPage((current) =>
        append && current
          ? { ...page, entries: [...current.entries, ...page.entries] }
          : page,
      );
      if (!folderId)
        setFolderTrail([{ id: page.folderId, name: page.folderName }]);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to browse Drive.",
      );
    } finally {
      setLoadingFolder(false);
    }
  };

  useEffect(() => {
    void loadFolder();
  }, []);

  const setField = <Key extends keyof CollectionDraft>(
    key: Key,
    value: CollectionDraft[Key],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  const beginEdit = (collection: PortfolioCollection) => {
    setError("");
    setMessage("");
    setDraft({
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      sessionDate: collection.sessionDate,
      location: collection.location,
      style: collection.style,
      lingerieBrand: collection.lingerieBrand ?? "",
      modelIds: collection.models.map((model) => model.id),
      newModels: [],
      driveImages: collection.photos.flatMap((photo) =>
        photo.driveFileId
          ? [{ id: photo.driveFileId, name: photo.altText }]
          : [],
      ),
    });
  };

  const toggleModel = (modelId: string) => {
    setDraft((current) => ({
      ...current,
      modelIds: current.modelIds.includes(modelId)
        ? current.modelIds.filter((id) => id !== modelId)
        : [...current.modelIds, modelId],
    }));
  };

  const addNewModel = () => {
    const name = newModel.name.trim();
    const profileUrl = newModel.profileUrl.trim();
    if (!name || !profileUrl) {
      setError("Enter both the model name and profile URL.");
      return;
    }
    setDraft((current) => ({
      ...current,
      newModels: [...current.newModels, { name, profileUrl }],
    }));
    setNewModel({ name: "", profileUrl: "" });
    setError("");
  };

  const toggleDriveImage = (entry: DriveEntry) => {
    setDraft((current) => ({
      ...current,
      driveImages: current.driveImages.some((image) => image.id === entry.id)
        ? current.driveImages.filter((image) => image.id !== entry.id)
        : [...current.driveImages, { id: entry.id, name: entry.name }],
    }));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.driveImages.length) return;
    const moving = draft.driveImages.slice(index, index + 1)[0];
    const reordered = draft.driveImages.filter(
      (_, imageIndex) => imageIndex !== index,
    );
    reordered.splice(target, 0, moving);
    setField("driveImages", reordered);
  };

  const refreshCollections = async () => {
    const response = await fetch("/api/admin/portfolio");
    const result = await getJson<{
      collections: PortfolioCollection[];
      models: PortfolioModel[];
    }>(response);
    setCollections(result.collections);
    setModels(result.models);
  };

  const saveCollection = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      await getJson<{ collectionId: string }>(response);
      await refreshCollections();
      setDraft(emptyDraft());
      setMessage("Collection saved and published.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save the collection.",
      );
    } finally {
      setSaving(false);
    }
  };

  const setArchived = async (collection: PortfolioCollection) => {
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/admin/portfolio/collections/${collection.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archived: !collection.archivedAt }),
        },
      );
      await getJson<{ archived: boolean }>(response);
      await refreshCollections();
      setMessage(
        collection.archivedAt ? "Collection restored." : "Collection archived.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update the collection.",
      );
    }
  };

  return {
    addNewModel,
    beginEdit,
    cancelEdit: () => setDraft(emptyDraft()),
    collections,
    draft,
    editing,
    error,
    folderPage,
    folderTrail,
    loadFolder,
    loadingFolder,
    message,
    models,
    moveImage,
    newModel,
    previewId,
    saveCollection,
    saving,
    selectedIds,
    setArchived,
    setDraft,
    setError,
    setField,
    setFolderTrail,
    setNewModel,
    setPreviewId,
    toggleDriveImage,
    toggleModel,
  };
};
