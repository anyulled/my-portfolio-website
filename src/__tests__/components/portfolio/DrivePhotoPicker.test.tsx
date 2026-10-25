import type React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import DrivePhotoPicker from "@/components/portfolio/DrivePhotoPicker";
import type {
  DriveFolderPage,
  PortfolioCollection,
} from "@/services/portfolio/types";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  ),
}));

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
  searchTerm: "",
  selectedIds: new Set<string>(),
  onBreadcrumb: jest.fn(),
  onLoadMore: jest.fn(),
  onMove: jest.fn(),
  onOpenFolder: jest.fn(),
  onRemove: jest.fn(),
  onSearch: jest.fn(),
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

  it("selects images, shows their preview, and loads another page", () => {
    render(<DrivePhotoPicker {...props} />);

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select portrait.jpg" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));

    expect(props.onToggle).toHaveBeenCalledWith(folderPage.entries[1]);
    expect(props.onLoadMore).toHaveBeenCalledTimes(1);
    expect(screen.getByAltText("portrait.jpg")).toBeInTheDocument();
    expect(screen.getByText("1 folder · 1 photo")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Loading preview for portrait.jpg"),
    ).toBeInTheDocument();
    act(() => fireEvent.load(screen.getByAltText("portrait.jpg")));
    expect(
      screen.queryByLabelText("Loading preview for portrait.jpg"),
    ).not.toBeInTheDocument();
  });

  it("filters the current folder by name", () => {
    render(<DrivePhotoPicker {...props} />);

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search this folder" }),
      {
        target: { value: "Margarita" },
      },
    );

    expect(props.onSearch).toHaveBeenCalledWith("Margarita");
  });

  it("shows an unavailable message when a thumbnail fails", () => {
    render(<DrivePhotoPicker {...props} />);

    fireEvent.error(screen.getByAltText("portrait.jpg"));

    expect(screen.getByText("Preview unavailable")).toBeInTheDocument();
  });

  it("marks selected images in the grid", () => {
    render(<DrivePhotoPicker {...props} selectedIds={new Set(["photo"])} />);

    expect(screen.getByText("Selected")).toBeInTheDocument();
  });

  it("shows selected images in order and supports moving and removing them", () => {
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
          id: "saved-photo",
          driveFileId: "photo",
          objectPath: "editorial/photo.webp",
          publicUrl: "https://example.com/photo.webp",
          altText: "Saved portrait",
          position: 0,
        },
      ],
      models: [],
    };
    render(
      <DrivePhotoPicker
        {...props}
        collections={[collection]}
        draft={{
          ...props.draft,
          id: collection.id,
          driveImages: [
            { id: "photo", name: "portrait.jpg" },
            { id: "new-photo", name: "new-portrait.jpg" },
          ],
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Move new-portrait.jpg up" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Move portrait.jpg down" }),
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    expect(screen.getByAltText("Saved portrait")).toHaveAttribute(
      "src",
      "https://example.com/photo.webp",
    );
    expect(props.onMove).toHaveBeenNthCalledWith(1, 1, -1);
    expect(props.onMove).toHaveBeenNthCalledWith(2, 0, 1);
    expect(props.onRemove).toHaveBeenCalledWith("photo");
    expect(screen.getByAltText("new-portrait.jpg")).toHaveAttribute(
      "src",
      "/api/admin/portfolio/drive/thumbnail?fileId=new-photo",
    );
  });

  it("distinguishes an empty folder from a search with no results", () => {
    const { rerender } = render(
      <DrivePhotoPicker
        {...props}
        folderPage={{ ...folderPage, entries: [] }}
      />,
    );
    expect(screen.getByText("This folder is empty.")).toBeInTheDocument();

    rerender(
      <DrivePhotoPicker
        {...props}
        folderPage={{ ...folderPage, entries: [] }}
        searchTerm="missing"
      />,
    );
    expect(
      screen.getByText("No files or folders match this search."),
    ).toBeInTheDocument();
  });

  it("renders safely before Drive finishes its first folder load", () => {
    render(<DrivePhotoPicker {...props} folderPage={null} loadingFolder />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading this folder…",
    );
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Load more files" }),
    ).not.toBeInTheDocument();
  });
});
