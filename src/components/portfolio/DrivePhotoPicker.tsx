import Image from "next/image";
import type {
  CollectionDraft,
  DriveEntry,
  DriveFolderPage,
  PortfolioCollection,
} from "@/services/portfolio/types";

interface DrivePhotoPickerProps {
  draft: CollectionDraft;
  collections: PortfolioCollection[];
  folderPage: DriveFolderPage | null;
  folderTrail: Array<{ id: string; name: string }>;
  loadingFolder: boolean;
  previewId: string | null;
  selectedIds: Set<string>;
  onBreadcrumb: (folder: { id: string; name: string }, index: number) => void;
  onLoadMore: () => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onOpenFolder: (entry: DriveEntry) => void;
  onPreview: (id: string) => void;
  onRemove: (id: string) => void;
  onToggle: (entry: DriveEntry) => void;
}

export default function DrivePhotoPicker(props: DrivePhotoPickerProps) {
  const selectedCollection = props.collections.find(
    (collection) => collection.id === props.draft.id,
  );

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-medium">Choose photos from Drive</h3>
        <p className="text-sm text-muted-foreground">
          Select images, then arrange their display order below.
        </p>
      </div>
      <nav
        aria-label="Drive folder path"
        className="flex flex-wrap items-center gap-2 text-sm"
      >
        {props.folderTrail.map((folder, index) => (
          <span key={folder.id} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            <button
              type="button"
              className="underline"
              onClick={() => props.onBreadcrumb(folder, index)}
            >
              {folder.name}
            </button>
          </span>
        ))}
      </nav>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {(props.folderPage?.entries ?? []).map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-2 rounded-md border p-3 text-sm"
          >
            {entry.isFolder ? (
              <button
                type="button"
                className="flex-1 text-left underline"
                onClick={() => props.onOpenFolder(entry)}
              >
                📁 {entry.name}
              </button>
            ) : (
              <>
                <label className="flex flex-1 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={props.selectedIds.has(entry.id)}
                    onChange={() => props.onToggle(entry)}
                  />
                  <span className="break-all">{entry.name}</span>
                </label>
                <button
                  type="button"
                  className="underline"
                  aria-expanded={props.previewId === entry.id}
                  onClick={() => props.onPreview(entry.id)}
                >
                  Preview
                </button>
                {props.previewId === entry.id && (
                  <Image
                    src={`/api/admin/portfolio/drive/thumbnail?fileId=${encodeURIComponent(entry.id)}`}
                    alt={entry.name}
                    width={160}
                    height={200}
                    unoptimized
                    className="h-36 w-28 rounded object-cover"
                  />
                )}
              </>
            )}
          </div>
        ))}
      </div>
      {props.folderPage?.nextPageToken && (
        <button
          type="button"
          className="rounded-md border px-3 py-2 text-sm"
          disabled={props.loadingFolder}
          onClick={props.onLoadMore}
        >
          Load more files
        </button>
      )}
      {props.loadingFolder && (
        <p role="status" className="text-sm">
          Loading Drive folder…
        </p>
      )}
      <ol className="space-y-2">
        {props.draft.driveImages.map((image, index) => {
          const existingPhoto = selectedCollection?.photos.find(
            (photo) => photo.driveFileId === image.id,
          );
          return (
            <li
              key={image.id}
              className="flex items-center gap-3 rounded-md border p-2"
            >
              {existingPhoto && (
                <Image
                  src={existingPhoto.publicUrl}
                  alt={existingPhoto.altText}
                  width={48}
                  height={64}
                  unoptimized
                  className="h-16 w-12 rounded object-cover"
                />
              )}
              <span className="min-w-0 flex-1 truncate text-sm">
                {index + 1}. {image.name}
              </span>
              <button
                type="button"
                aria-label={`Move ${image.name} up`}
                disabled={index === 0}
                onClick={() => props.onMove(index, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move ${image.name} down`}
                disabled={index === props.draft.driveImages.length - 1}
                onClick={() => props.onMove(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="text-destructive"
                onClick={() => props.onRemove(image.id)}
              >
                Remove
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
