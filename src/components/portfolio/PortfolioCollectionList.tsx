import type { PortfolioCollection } from "@/services/portfolio/types";

interface PortfolioCollectionListProps {
  collections: PortfolioCollection[];
  onEdit: (collection: PortfolioCollection) => void;
  onArchive: (collection: PortfolioCollection) => void;
}

export default function PortfolioCollectionList({
  collections,
  onEdit,
  onArchive,
}: PortfolioCollectionListProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Collections</h2>
      {collections.length === 0 ? (
        <p className="text-sm text-muted-foreground">No collections yet.</p>
      ) : (
        <ul className="space-y-3">
          {collections.map((collection) => (
            <li
              key={collection.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border p-4"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-medium">{collection.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {collection.sessionDate} · {collection.location} ·{" "}
                  {collection.style}
                  {collection.archivedAt ? " · Archived" : " · Published"}
                </p>
              </div>
              {!collection.archivedAt && (
                <a
                  className="rounded-md border px-3 py-2 text-sm"
                  href={`/portfolio/${collection.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View
                </a>
              )}
              <button
                type="button"
                className="rounded-md border px-3 py-2 text-sm"
                onClick={() => onEdit(collection)}
              >
                Edit
              </button>
              <button
                type="button"
                className="rounded-md border px-3 py-2 text-sm"
                onClick={() => onArchive(collection)}
              >
                {collection.archivedAt ? "Restore" : "Archive"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
