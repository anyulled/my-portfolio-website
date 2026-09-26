import { fireEvent, render, screen } from "@testing-library/react";
import DrivePhotoPicker from "@/components/portfolio/DrivePhotoPicker";
import type { DriveFolderPage } from "@/services/portfolio/types";

const folderPage: DriveFolderPage = {
  folderId: "root",
  folderName: "tearsheets",
  nextPageToken: "next-page",
  entries: [
    {
      id: "nested-folder",
      name: "2026 collection",
      mimeType: "application/vnd.google-apps.folder",
      isFolder: true,
    },
    {
      id: "photo",
      name: "portrait.jpg",
      mimeType: "image/jpeg",
      isFolder: false,
    },
  ],
};

const props = {
  draft: {
    name: "",
    slug: "",
    sessionDate: "2026-09-26",
    location: "Barcelona",
    style: "portrait" as const,
    lingerieBrand: "",
    modelIds: [],
    newModels: [],
    driveImages: [],
  },
  collections: [],
  folderPage,
  folderTrail: [
    { id: "root", name: "tearsheets" },
    { id: "nested-folder", name: "2026 collection" },
  ],
  loadingFolder: false,
  previewId: null,
  selectedIds: new Set<string>(),
  onBreadcrumb: jest.fn(),
  onLoadMore: jest.fn(),
  onMove: jest.fn(),
  onOpenFolder: jest.fn(),
  onPreview: jest.fn(),
  onRemove: jest.fn(),
  onToggle: jest.fn(),
};

describe("DrivePhotoPicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens nested folders and navigates back through breadcrumbs", () => {
    render(<DrivePhotoPicker {...props} />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /2026 collection/ })[1],
    );
    fireEvent.click(screen.getByRole("button", { name: "tearsheets" }));

    expect(props.onOpenFolder).toHaveBeenCalledWith(folderPage.entries[0]);
    expect(props.onBreadcrumb).toHaveBeenCalledWith(
      { id: "root", name: "tearsheets" },
      0,
    );
  });

  it("selects images, previews them, and loads another page", () => {
    render(<DrivePhotoPicker {...props} />);

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    fireEvent.click(screen.getByRole("button", { name: "Load more files" }));

    expect(props.onToggle).toHaveBeenCalledWith(folderPage.entries[1]);
    expect(props.onPreview).toHaveBeenCalledWith("photo");
    expect(props.onLoadMore).toHaveBeenCalledTimes(1);
    render(<DrivePhotoPicker {...props} previewId="photo" />);
    expect(screen.getByAltText("portrait.jpg")).toBeInTheDocument();
  });

  it("renders safely before Drive finishes its first folder load", () => {
    render(<DrivePhotoPicker {...props} folderPage={null} loadingFolder />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading Drive folder…",
    );
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Load more files" }),
    ).not.toBeInTheDocument();
  });
});
