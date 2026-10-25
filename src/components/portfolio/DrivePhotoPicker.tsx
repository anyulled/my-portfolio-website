import { useState } from "react";
import Image from "next/image";
import { Folder, ImageOff, Search } from "lucide-react";
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
  searchTerm: string;
  selectedIds: Set<string>;
  onBreadcrumb: (folder: { id: string; name: string }, index: number) => void;
  onLoadMore: () => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onOpenFolder: (entry: DriveEntry) => void;
  onRemove: (id: string) => void;
  onSearch: (value: string) => void;
  onToggle: (entry: DriveEntry) => void;
}

interface DriveImageCardProps {
  entry: DriveEntry;
  selected: boolean;
  onToggle: (entry: DriveEntry) => void;
}

interface DriveFolderCardProps {
  entry: DriveEntry;
  onOpenFolder: (entry: DriveEntry) => void;
}

interface DriveEntryGridProps {
  entries: DriveEntry[];
  selectedIds: Set<string>;
  onOpenFolder: (entry: DriveEntry) => void;
  onToggle: (entry: DriveEntry) => void;
}

interface SelectedPhotoOrderProps {
  draft: CollectionDraft;
  selectedCollection: PortfolioCollection | undefined;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
}

function DriveFolderCard({ entry, onOpenFolder }: DriveFolderCardProps) {
  return (
    <button
      type="button"
      className="flex min-h-20 items-center gap-3 rounded-lg border bg-card p-3 text-left transition hover:border-primary/50 hover:bg-muted/50"
      onClick={() => onOpenFolder(entry)}
    >
      <Folder aria-hidden="true" className="size-6 shrink-0 text-primary" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium" title={entry.name}>
          {entry.name}
        </span>
        <span className="text-xs text-muted-foreground">Open folder</span>
      </span>
    </button>
  );
}

function DriveEntryGrid({
  entries,
  selectedIds,
  onOpenFolder,
  onToggle,
}: DriveEntryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {entries.map((entry) =>
        entry.isFolder ? (
          <DriveFolderCard
            key={entry.id}
            entry={entry}
            onOpenFolder={onOpenFolder}
          />
        ) : (
          <DriveImageCard
            key={entry.id}
            entry={entry}
            selected={selectedIds.has(entry.id)}
            onToggle={onToggle}
          />
        ),
      )}
    </div>
  );
}

const getDriveEmptyMessage = (loading: boolean, searchTerm: string) => {
  if (loading) return "Loading files…";
  if (searchTerm) return "No files or folders match this search.";
  return "This folder is empty.";
};

function DriveEmptyState({
  loading,
  searchTerm,
}: {
  loading: boolean;
  searchTerm: string;
}) {
  const message = getDriveEmptyMessage(loading, searchTerm);

  return (
    <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

function SelectedPhotoOrder({
  draft,
  selectedCollection,
  onMove,
  onRemove,
}: SelectedPhotoOrderProps) {
  return (
    <div className="space-y-3 border-t pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-medium">Selected photo order</h4>
        <p className="text-xs text-muted-foreground">
          Use the arrows to set the display order.
        </p>
      </div>
      <ol className="space-y-2">
        {draft.driveImages.map((image, index) => {
          const existingPhoto = selectedCollection?.photos.find(
            (photo) => photo.driveFileId === image.id,
          );
          return (
            <li
              key={image.id}
              className="flex min-w-0 items-center gap-3 rounded-lg border bg-card p-2"
            >
              <Image
                src={
                  existingPhoto?.publicUrl ??
                  `/api/admin/portfolio/drive/thumbnail?fileId=${encodeURIComponent(image.id)}`
                }
                alt={existingPhoto?.altText ?? image.name}
                width={48}
                height={60}
                unoptimized
                className="size-12 shrink-0 rounded object-cover"
              />
              <span className="min-w-0 flex-1 truncate text-sm">
                {index + 1}. {image.name}
              </span>
              <button
                type="button"
                aria-label={`Move ${image.name} up`}
                disabled={index === 0}
                onClick={() => onMove(index, -1)}
                className="size-9 rounded border disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move ${image.name} down`}
                disabled={index === draft.driveImages.length - 1}
                onClick={() => onMove(index, 1)}
                className="size-9 rounded border disabled:opacity-40"
              >
                ↓
              </button>
              <button
                type="button"
                className="rounded px-2 py-1 text-sm text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(image.id)}
              >
                Remove
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function DriveImageCard({ entry, selected, onToggle }: DriveImageCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <label
      className={`group relative block cursor-pointer overflow-hidden rounded-lg border bg-card transition-colors ${
        selected
          ? "border-primary ring-2 ring-primary/30"
          : "hover:border-primary/50"
      }`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {!loaded && !failed && (
          <div
            aria-label={`Loading preview for ${entry.name}`}
            className="absolute inset-0 animate-pulse bg-muted"
          />
        )}
        {failed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff aria-hidden="true" className="size-8" />
            <span className="px-3 text-center text-xs">
              Preview unavailable
            </span>
          </div>
        ) : (
          <Image
            src={`/api/admin/portfolio/drive/thumbnail?fileId=${encodeURIComponent(entry.id)}`}
            alt={entry.name}
            width={320}
            height={400}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
            unoptimized
            loading="lazy"
            className={`h-full w-full object-cover transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-1 text-xs font-medium shadow-sm">
          {selected ? "Selected" : "Photo"}
        </span>
      </div>
      <span className="flex min-h-12 items-center gap-2 p-3 text-sm">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(entry)}
          aria-label={`Select ${entry.name}`}
          className="size-4 shrink-0 accent-primary"
        />
        <span className="min-w-0 truncate" title={entry.name}>
          {entry.name}
        </span>
      </span>
    </label>
  );
}

export default function DrivePhotoPicker(props: DrivePhotoPickerProps) {
  const selectedCollection = props.collections.find(
    (collection) => collection.id === props.draft.id,
  );
  const entries = props.folderPage?.entries ?? [];
  const counts = entries.reduce(
    (total, entry) =>
      entry.isFolder
        ? { ...total, folders: total.folders + 1 }
        : { ...total, photos: total.photos + 1 },
    { folders: 0, photos: 0 },
  );

  return (
    <section className="space-y-5 rounded-xl border bg-background p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Choose photos from Drive</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Select photos, then arrange their display order below.
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
          {props.draft.driveImages.length} selected
        </span>
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
              className="rounded px-1 py-0.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              onClick={() => props.onBreadcrumb(folder, index)}
            >
              {folder.name}
            </button>
          </span>
        ))}
      </nav>
      <div className="space-y-3">
        <label className="relative block">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={props.searchTerm}
            onChange={(event) => props.onSearch(event.target.value)}
            placeholder="Search files and folders in this folder"
            aria-label="Search this folder"
            className="w-full rounded-lg border bg-card py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            {counts.folders} {counts.folders === 1 ? "folder" : "folders"} ·{" "}
            {counts.photos} {counts.photos === 1 ? "photo" : "photos"}
          </p>
          {props.loadingFolder && <p role="status">Loading this folder…</p>}
        </div>
      </div>
      {entries.length > 0 ? (
        <DriveEntryGrid
          entries={entries}
          selectedIds={props.selectedIds}
          onOpenFolder={props.onOpenFolder}
          onToggle={props.onToggle}
        />
      ) : (
        <DriveEmptyState
          loading={props.loadingFolder}
          searchTerm={props.searchTerm}
        />
      )}
      {props.folderPage?.nextPageToken && (
        <button
          type="button"
          className="w-full rounded-lg border px-3 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-wait disabled:opacity-50 sm:w-auto"
          disabled={props.loadingFolder}
          onClick={props.onLoadMore}
        >
          {props.loadingFolder ? "Loading…" : "Load more"}
        </button>
      )}
      {props.draft.driveImages.length > 0 && (
        <SelectedPhotoOrder
          draft={props.draft}
          selectedCollection={selectedCollection}
          onMove={props.onMove}
          onRemove={props.onRemove}
        />
      )}
    </section>
  );
}
