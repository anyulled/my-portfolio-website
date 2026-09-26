import { act, renderHook, waitFor } from "@testing-library/react";
import { usePortfolioManager } from "@/components/portfolio/usePortfolioManager";
import type {
  DriveFolderPage,
  PortfolioCollection,
} from "@/services/portfolio/types";

const collection: PortfolioCollection = {
  id: "collection-id",
  name: "Editorial",
  slug: "editorial",
  sessionDate: "2026-09-26",
  location: "Barcelona",
  style: "portrait",
  lingerieBrand: null,
  archivedAt: null,
  photos: [
    {
      id: "photo-record",
      driveFileId: "photo-id",
      objectPath: "portfolio/photo.webp",
      publicUrl: "https://example.com/photo.webp",
      altText: "photo.jpg",
      position: 0,
    },
  ],
  models: [
    {
      id: "model-id",
      name: "Model",
      slug: "model",
      profileUrl: "https://example.com/model",
    },
  ],
};

const drivePage: DriveFolderPage = {
  folderId: "root",
  folderName: "tearsheets",
  entries: [
    { id: "folder-id", name: "Subfolder", mimeType: "folder", isFolder: true },
    {
      id: "photo-id",
      name: "photo.jpg",
      mimeType: "image/jpeg",
      isFolder: false,
    },
  ],
  nextPageToken: "next",
};

const createResponse = (body: unknown, ok = true): Response =>
  ({ ok, json: async () => body }) as Response;

describe("usePortfolioManager", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("loads the root folder, browses folders, and appends paginated entries", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createResponse(drivePage))
      .mockResolvedValueOnce(
        createResponse({
          ...drivePage,
          folderId: "folder-id",
          nextPageToken: null,
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          ...drivePage,
          entries: [drivePage.entries[1]],
          nextPageToken: null,
        }),
      );
    global.fetch = fetchMock;
    const { result } = renderHook(() =>
      usePortfolioManager({ collections: [], models: [] }),
    );

    await waitFor(() => expect(result.current.folderPage).toEqual(drivePage));
    expect(result.current.folderTrail).toEqual([
      { id: "root", name: "tearsheets" },
    ]);
    await act(async () => result.current.loadFolder("folder-id"));
    expect(result.current.folderPage?.folderId).toBe("folder-id");
    await act(async () => result.current.loadFolder("root", "next", true));
    expect(result.current.folderPage?.entries).toHaveLength(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/admin/portfolio/drive?folderId=root&pageToken=next",
    );
  });

  it("tracks selected images, new models, edits, ordering, and cancellation", async () => {
    global.fetch = jest.fn().mockResolvedValue(createResponse(drivePage));
    const { result } = renderHook(() =>
      usePortfolioManager({
        collections: [collection],
        models: collection.models,
      }),
    );
    await waitFor(() => expect(result.current.folderPage).not.toBeNull());

    act(() => result.current.toggleDriveImage(drivePage.entries[1]));
    expect(result.current.draft.driveImages).toEqual([
      { id: "photo-id", name: "photo.jpg" },
    ]);
    act(() => result.current.toggleModel("model-id"));
    expect(result.current.draft.modelIds).toEqual(["model-id"]);
    act(() =>
      result.current.setNewModel({
        name: " New Model ",
        profileUrl: " https://example.com/new ",
      }),
    );
    act(() => result.current.addNewModel());
    expect(result.current.draft.newModels).toEqual([
      { name: "New Model", profileUrl: "https://example.com/new" },
    ]);
    act(() => result.current.beginEdit(collection));
    expect(result.current.editing).toBe(true);
    expect(result.current.draft.driveImages).toEqual([
      { id: "photo-id", name: "photo.jpg" },
    ]);
    act(() =>
      result.current.setField("driveImages", [
        { id: "first", name: "first" },
        { id: "second", name: "second" },
      ]),
    );
    act(() => result.current.moveImage(0, 1));
    expect(result.current.draft.driveImages.map(({ id }) => id)).toEqual([
      "second",
      "first",
    ]);
    act(() => result.current.moveImage(0, -1));
    expect(result.current.draft.driveImages.map(({ id }) => id)).toEqual([
      "second",
      "first",
    ]);
    act(() => result.current.cancelEdit());
    expect(result.current.editing).toBe(false);
  });

  it("reports invalid model input and folder loading errors", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(createResponse(drivePage))
      .mockRejectedValueOnce(new Error("Drive unavailable"));
    const { result } = renderHook(() =>
      usePortfolioManager({ collections: [], models: [] }),
    );
    await waitFor(() => expect(result.current.folderPage).toEqual(drivePage));

    act(() => result.current.setNewModel({ name: "", profileUrl: "" }));
    act(() => result.current.addNewModel());
    expect(result.current.error).toBe(
      "Enter both the model name and profile URL.",
    );
    await act(async () => result.current.loadFolder("broken"));
    expect(result.current.error).toBe("Drive unavailable");
    expect(result.current.loadingFolder).toBe(false);
  });

  it("saves collections, reloads them, and reports server errors", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createResponse(drivePage))
      .mockResolvedValueOnce(createResponse({ collectionId: "saved-id" }))
      .mockResolvedValueOnce(
        createResponse({
          collections: [collection],
          models: collection.models,
        }),
      )
      .mockResolvedValueOnce(createResponse({}, false));
    global.fetch = fetchMock;
    const { result } = renderHook(() =>
      usePortfolioManager({ collections: [], models: [] }),
    );
    await waitFor(() => expect(result.current.folderPage).toEqual(drivePage));
    const event = {
      preventDefault: jest.fn(),
    } as unknown as React.FormEvent<HTMLFormElement>;
    await act(async () => result.current.saveCollection(event));
    expect(event.preventDefault).toHaveBeenCalled();
    expect(result.current.collections).toEqual([collection]);
    expect(result.current.message).toBe("Collection saved and published.");
    await act(async () => result.current.saveCollection(event));
    expect(result.current.error).toBe("The request could not be completed.");
    expect(result.current.saving).toBe(false);
  });

  it("archives and restores collections while surfacing failures", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createResponse(drivePage))
      .mockResolvedValueOnce(createResponse({ archived: true }))
      .mockResolvedValueOnce(createResponse({ collections: [], models: [] }))
      .mockResolvedValueOnce(createResponse({ message: "Unavailable" }, false));
    global.fetch = fetchMock;
    const { result } = renderHook(() =>
      usePortfolioManager({ collections: [collection], models: [] }),
    );
    await waitFor(() => expect(result.current.folderPage).toEqual(drivePage));
    await act(async () => result.current.setArchived(collection));
    expect(result.current.message).toBe("Collection archived.");
    await act(async () =>
      result.current.setArchived({ ...collection, archivedAt: "2026-09-26" }),
    );
    expect(result.current.error).toBe("Unavailable");
  });
});
