"use client";

import DrivePhotoPicker from "@/components/portfolio/DrivePhotoPicker";
import { usePortfolioManager } from "@/components/portfolio/usePortfolioManager";
import PortfolioCollectionList from "@/components/portfolio/PortfolioCollectionList";
import type {
  PortfolioCollection,
  PortfolioModel,
  PortfolioStyle,
} from "@/services/portfolio/types";
import { portfolioStyles } from "@/services/portfolio/types";
import { slugifyPortfolioName } from "@/lib/portfolio";

interface PortfolioManagerProps {
  collections: PortfolioCollection[];
  models: PortfolioModel[];
}

export default function PortfolioManager({
  collections: initialCollections,
  models: initialModels,
}: PortfolioManagerProps) {
  const {
    addNewModel,
    beginEdit,
    cancelEdit,
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
    setField,
    setFolderTrail,
    setNewModel,
    setPreviewId,
    toggleDriveImage,
    toggleModel,
  } = usePortfolioManager({
    collections: initialCollections,
    models: initialModels,
  });

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Portfolio collections</h1>
        <p className="text-muted-foreground">
          Choose photos from the tearsheets Drive folder and publish a curated
          session.
        </p>
      </header>

      <form
        onSubmit={saveCollection}
        className="space-y-8 rounded-xl border p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            {editing ? "Edit collection" : "New collection"}
          </h2>
          {editing && (
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm"
              onClick={cancelEdit}
            >
              Cancel editing
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Collection name</span>
            <input
              className="w-full rounded-md border bg-background px-3 py-2"
              required
              value={draft.name}
              onChange={(event) => {
                const name = event.target.value;
                setDraft((current) => ({
                  ...current,
                  name,
                  slug: current.id ? current.slug : slugifyPortfolioName(name),
                }));
              }}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Collection URL slug</span>
            <input
              className="w-full rounded-md border bg-background px-3 py-2"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
              value={draft.slug}
              onChange={(event) => setField("slug", event.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Session date</span>
            <input
              className="w-full rounded-md border bg-background px-3 py-2"
              type="date"
              required
              value={draft.sessionDate}
              onChange={(event) => setField("sessionDate", event.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Location</span>
            <input
              className="w-full rounded-md border bg-background px-3 py-2"
              required
              value={draft.location}
              onChange={(event) => setField("location", event.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Style</span>
            <select
              className="w-full rounded-md border bg-background px-3 py-2"
              value={draft.style}
              onChange={(event) =>
                setField("style", event.target.value as PortfolioStyle)
              }
            >
              {portfolioStyles.map((style) => (
                <option key={style} value={style}>
                  {style.replaceAll("-", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Lingerie brand (optional)</span>
            <input
              className="w-full rounded-md border bg-background px-3 py-2"
              value={draft.lingerieBrand}
              onChange={(event) =>
                setField("lingerieBrand", event.target.value)
              }
            />
          </label>
        </div>

        <section className="space-y-3">
          <h3 className="font-medium">Models</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <label
                key={model.id}
                className="flex items-center gap-2 rounded-md border p-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={draft.modelIds.includes(model.id)}
                  onChange={() => toggleModel(model.id)}
                />
                <span>{model.name}</span>
                <a
                  className="ml-auto underline"
                  href={model.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                >
                  Profile
                </a>
              </label>
            ))}
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <input
              className="rounded-md border bg-background px-3 py-2"
              placeholder="New model name"
              value={newModel.name}
              onChange={(event) =>
                setNewModel((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <input
              className="rounded-md border bg-background px-3 py-2"
              type="url"
              placeholder="https://model-profile.example"
              value={newModel.profileUrl}
              onChange={(event) =>
                setNewModel((current) => ({
                  ...current,
                  profileUrl: event.target.value,
                }))
              }
            />
            <button
              type="button"
              className="rounded-md border px-4 py-2"
              onClick={addNewModel}
            >
              Add model
            </button>
          </div>
          {draft.newModels.length > 0 && (
            <ul className="space-y-2 text-sm">
              {draft.newModels.map((model, index) => (
                <li
                  key={`${model.name}-${index}`}
                  className="flex items-center gap-2 rounded-md bg-muted px-3 py-2"
                >
                  <span>{model.name}</span>
                  <a
                    className="underline"
                    href={model.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Profile
                  </a>
                  <button
                    type="button"
                    className="ml-auto underline"
                    onClick={() =>
                      setField(
                        "newModels",
                        draft.newModels.filter(
                          (_, modelIndex) => modelIndex !== index,
                        ),
                      )
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <DrivePhotoPicker
          draft={draft}
          collections={collections}
          folderPage={folderPage}
          folderTrail={folderTrail}
          loadingFolder={loadingFolder}
          previewId={previewId}
          selectedIds={selectedIds}
          onBreadcrumb={(folder, index) => {
            setFolderTrail((current) => current.slice(0, index + 1));
            void loadFolder(folder.id);
          }}
          onLoadMore={() =>
            folderPage?.nextPageToken &&
            void loadFolder(folderPage.folderId, folderPage.nextPageToken, true)
          }
          onMove={moveImage}
          onOpenFolder={(entry) => {
            setFolderTrail((current) => [
              ...current,
              { id: entry.id, name: entry.name },
            ]);
            void loadFolder(entry.id);
          }}
          onPreview={(id) =>
            setPreviewId((current) => (current === id ? null : id))
          }
          onRemove={(id) =>
            setField(
              "driveImages",
              draft.driveImages.filter((image) => image.id !== id),
            )
          }
          onToggle={toggleDriveImage}
        />

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm text-green-700">
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={saving || draft.driveImages.length === 0}
          className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving and publishing…" : "Save and publish"}
        </button>
      </form>

      <PortfolioCollectionList
        collections={collections}
        onEdit={beginEdit}
        onArchive={(collection) => void setArchived(collection)}
      />
    </main>
  );
}
