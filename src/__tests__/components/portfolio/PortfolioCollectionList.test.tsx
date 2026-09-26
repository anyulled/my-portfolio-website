import { fireEvent, render, screen } from "@testing-library/react";
import PortfolioCollectionList from "@/components/portfolio/PortfolioCollectionList";
import { getHarnessPortfolioCollections } from "@/services/harness/fixtures";

describe("PortfolioCollectionList", () => {
  it("shows the empty state", () => {
    render(
      <PortfolioCollectionList
        collections={[]}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
      />,
    );
    expect(screen.getByText("No collections yet.")).toBeInTheDocument();
  });

  it("offers edit, view, archive, and restore actions based on publication state", () => {
    const collections = getHarnessPortfolioCollections();
    const archived = {
      ...collections[0],
      id: "archived-id",
      archivedAt: "2026-09-25",
    };
    const onEdit = jest.fn();
    const onArchive = jest.fn();
    render(
      <PortfolioCollectionList
        collections={[collections[0], archived]}
        onEdit={onEdit}
        onArchive={onArchive}
      />,
    );

    expect(screen.getAllByRole("link", { name: "View" })).toHaveLength(1);
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    expect(onEdit).toHaveBeenCalledWith(collections[0]);
    expect(onArchive).toHaveBeenNthCalledWith(1, collections[0]);
    expect(onArchive).toHaveBeenNthCalledWith(2, archived);
    expect(screen.getByText(/Published/)).toBeInTheDocument();
    expect(screen.getByText(/Archived/)).toBeInTheDocument();
  });
});
