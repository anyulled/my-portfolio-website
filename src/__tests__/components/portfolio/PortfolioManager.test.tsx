jest.mock("@/components/portfolio/usePortfolioManager", () => ({
  usePortfolioManager: jest.fn(),
}));

import { fireEvent, render, screen } from "@testing-library/react";
import PortfolioManager from "@/components/portfolio/PortfolioManager";
import { usePortfolioManager } from "@/components/portfolio/usePortfolioManager";
import { getHarnessPortfolioCollections } from "@/services/harness/fixtures";
import type {
  DriveFolderPage,
  PortfolioCollection,
} from "@/services/portfolio/types";

const collections = getHarnessPortfolioCollections();
const collection: PortfolioCollection = {
  ...collections[0],
  id: "collection-id",
  photos: [
    {
      id: "first-photo",
      driveFileId: "first",
      objectPath: "first.webp",
      publicUrl: "https://example.com/first.webp",
      altText: "first.jpg",
      position: 0,
    },
    {
      id: "second-photo",
      driveFileId: "second",
      objectPath: "second.webp",
      publicUrl: "https://example.com/second.webp",
      altText: "second.jpg",
      position: 1,
    },
  ],
};
const folderPage: DriveFolderPage = {
  folderId: "root",
  folderName: "tearsheets",
  entries: [
    { id: "nested", name: "Nested", mimeType: "folder", isFolder: true },
    { id: "third", name: "third.jpg", mimeType: "image/jpeg", isFolder: false },
  ],
  nextPageToken: "next",
};

const callbacks = {
  addNewModel: jest.fn(),
  beginEdit: jest.fn(),
  cancelEdit: jest.fn(),
  loadFolder: jest.fn(),
  moveImage: jest.fn(),
  saveCollection: jest.fn(),
  setArchived: jest.fn(),
  setDraft: jest.fn(),
  setField: jest.fn(),
  setFolderTrail: jest.fn(),
  setNewModel: jest.fn(),
  setPreviewId: jest.fn(),
  toggleDriveImage: jest.fn(),
  toggleModel: jest.fn(),
};

const makeManagerState = (overrides: Record<string, unknown> = {}) => ({
  ...callbacks,
  collections: [collection],
  draft: {
    id: "collection-id",
    name: "Editorial",
    slug: "editorial",
    sessionDate: "2026-09-26",
    location: "Barcelona",
    style: "portrait",
    lingerieBrand: "Brand",
    modelIds: [collection.models[0].id],
    newModels: [{ name: "New Model", profileUrl: "https://example.com/new" }],
    driveImages: [
      { id: "first", name: "first.jpg" },
      { id: "second", name: "second.jpg" },
    ],
  },
  editing: true,
  error: "There was a warning.",
  folderPage,
  folderTrail: [{ id: "root", name: "tearsheets" }],
  loadingFolder: false,
  message: "Collection saved.",
  models: collection.models,
  newModel: { name: "", profileUrl: "" },
  previewId: "third",
  saving: false,
  selectedIds: new Set(["first", "second"]),
  ...overrides,
});

describe("PortfolioManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(usePortfolioManager)
      .mockReturnValue(makeManagerState() as never);
  });

  it("edits collection fields, models, Drive photos, and existing collections", () => {
    render(
      <PortfolioManager
        collections={[collection]}
        models={collection.models}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Edit collection" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Collection name"), {
      target: { value: "New Editorial" },
    });
    fireEvent.change(screen.getByLabelText("Collection URL slug"), {
      target: { value: "new-editorial" },
    });
    fireEvent.change(screen.getByLabelText("Session date"), {
      target: { value: "2026-10-01" },
    });
    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Girona" },
    });
    fireEvent.change(screen.getByLabelText("Style"), {
      target: { value: "boudoir" },
    });
    fireEvent.change(screen.getByLabelText("Lingerie brand (optional)"), {
      target: { value: "Brand Two" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /Harness Model/ }));
    fireEvent.change(screen.getByPlaceholderText("New model name"), {
      target: { value: "Another Model" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("https://model-profile.example"),
      { target: { value: "https://example.com/another" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Add model" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    fireEvent.click(screen.getByRole("button", { name: /Nested/ }));
    fireEvent.click(screen.getByRole("button", { name: "tearsheets" }));
    fireEvent.click(screen.getByRole("button", { name: "Load more files" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /third.jpg/ }));
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    fireEvent.click(
      screen.getByRole("button", { name: "Move first.jpg down" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel editing" }));
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.submit(
      screen.getByRole("button", { name: "Save and publish" }).closest("form")!,
    );

    expect(callbacks.setDraft).toHaveBeenCalled();
    const updateDraft = callbacks.setDraft.mock.calls[0][0] as (current: {
      id?: string;
      slug: string;
    }) => { slug: string };
    expect(updateDraft({ id: "existing", slug: "old-slug" }).slug).toBe(
      "old-slug",
    );
    const updatePreview = callbacks.setPreviewId.mock.calls[0][0] as (
      current: string | null,
    ) => string | null;
    expect(updatePreview("third")).toBeNull();
    expect(updatePreview(null)).toBe("third");
    expect(callbacks.setField).toHaveBeenCalled();
    expect(callbacks.toggleModel).toHaveBeenCalledWith(collection.models[0].id);
    expect(callbacks.addNewModel).toHaveBeenCalled();
    expect(callbacks.loadFolder).toHaveBeenCalled();
    expect(callbacks.toggleDriveImage).toHaveBeenCalled();
    expect(callbacks.moveImage).toHaveBeenCalledWith(0, 1);
    expect(callbacks.cancelEdit).toHaveBeenCalled();
    expect(callbacks.setArchived).toHaveBeenCalledWith(collection);
    expect(callbacks.beginEdit).toHaveBeenCalledWith(collection);
    expect(callbacks.saveCollection).toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("There was a warning.");
    expect(screen.getByRole("status")).toHaveTextContent("Collection saved.");
  });

  it("renders a new collection state while saving and without an archiveable record", () => {
    jest.mocked(usePortfolioManager).mockReturnValue(
      makeManagerState({
        collections: [],
        draft: {
          name: "",
          slug: "",
          sessionDate: "2026-09-26",
          location: "",
          style: "portrait",
          lingerieBrand: "",
          modelIds: [],
          newModels: [],
          driveImages: [],
        },
        editing: false,
        error: "",
        message: "",
        saving: true,
        selectedIds: new Set(),
        folderPage: { ...folderPage, entries: [], nextPageToken: null },
        loadingFolder: true,
      }) as never,
    );
    render(<PortfolioManager collections={[]} models={[]} />);
    expect(
      screen.getByRole("heading", { name: "New collection" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Saving and publishing…" }),
    ).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading Drive folder…",
    );
    expect(screen.getByText("No collections yet.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Collection name"), {
      target: { value: "New Editorial" },
    });
    const updateDraft = callbacks.setDraft.mock.calls[0][0] as (current: {
      id?: string;
      slug: string;
    }) => { slug: string };
    expect(updateDraft({ slug: "" }).slug).toBe("new-editorial");
  });
});
