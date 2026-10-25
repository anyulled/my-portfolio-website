import { useEffect, useMemo, useRef, useState } from "react";
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

const getDriveFolderUrl = (
  folderId?: string,
  pageToken?: string,
  searchQuery = "",
) => {
  const params = new URLSearchParams();
  if (folderId) params.set("folderId", folderId);
  if (pageToken) params.set("pageToken", pageToken);
  if (searchQuery) params.set("search", searchQuery);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return `/api/admin/portfolio/drive${suffix}`;
};

const mergeDriveFolderPage = (
  current: DriveFolderPage | null,
  next: DriveFolderPage,
  append: boolean,
): DriveFolderPage =>
  append && current
    ? { ...next, entries: [...current.entries, ...next.entries] }
    : next;

const reportDriveFolderError = (
  error: unknown,
  controller: AbortController,
  setError: (message: string) => void,
) => {
  if (controller.signal.aborted) return;
  setError(error instanceof Error ? error.message : "Unable to browse Drive.");
};

const finishDriveFolderRequest = (
  controller: AbortController,
  activeRequest: { current: AbortController | null },
  setLoadingFolder: (loading: boolean) => void,
) => {
  if (activeRequest.current !== controller) return;
  activeRequest.current = null;
  setLoadingFolder(false);
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
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [folderTrail, setFolderTrail] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loadingFolder, setLoadingFolder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const activeFolderId = useRef<string | undefined>(undefined);
  const activeFolderRequest = useRef<AbortController | null>(null);
  const skipInitialSearch = useRef(true);
  const editing = Boolean(draft.id);
  const selectedIds = useMemo(
    () => new Set(draft.driveImages.map((image) => image.id)),
    [draft.driveImages],
  );

  const loadFolder = async (
    folderId?: string,
    pageToken?: string,
    append = false,
    searchQuery = debouncedSearchTerm,
  ) => {
    activeFolderRequest.current?.abort();
    const controller = new AbortController();
    activeFolderRequest.current = controller;
    activeFolderId.current = folderId;
    setLoadingFolder(true);
    setError("");
    if (!append) setFolderPage(null);
    try {
      const page = await getJson<DriveFolderPage>(
        await fetch(getDriveFolderUrl(folderId, pageToken, searchQuery), {
          signal: controller.signal,
        }),
      );
      if (controller.signal.aborted) return;
      activeFolderId.current = page.folderId;
      setFolderPage((current) => mergeDriveFolderPage(current, page, append));
      if (!folderId)
        setFolderTrail([{ id: page.folderId, name: page.folderName }]);
    } catch (caught) {
      reportDriveFolderError(caught, controller, setError);
    } finally {
      finishDriveFolderRequest(
        controller,
        activeFolderRequest,
        setLoadingFolder,
      );
    }
  };

  useEffect(() => {
    void loadFolder();
    return () => activeFolderRequest.current?.abort();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearchTerm(searchTerm.trim()),
      300,
    );
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    if (skipInitialSearch.current) {
      skipInitialSearch.current = false;
      return;
    }
    void loadFolder(
      activeFolderId.current,
      undefined,
      false,
      debouncedSearchTerm,
    );
  }, [debouncedSearchTerm]);

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
    saveCollection,
    saving,
    searchTerm,
    setSearchTerm,
    selectedIds,
    setArchived,
    setDraft,
    setError,
    setField,
    setFolderTrail,
    setNewModel,
    toggleDriveImage,
    toggleModel,
  };
};
