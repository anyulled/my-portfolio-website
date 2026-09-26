export const portfolioStyles = [
  "portrait",
  "artistic-nude",
  "boudoir",
  "glamour",
  "swimwear",
  "fashion",
  "lifestyle",
] as const;

export type PortfolioStyle = (typeof portfolioStyles)[number];

export interface PortfolioModel {
  id: string;
  name: string;
  slug: string;
  profileUrl: string;
}

export interface PortfolioPhoto {
  id: string;
  driveFileId?: string;
  objectPath: string;
  publicUrl: string;
  altText: string;
  position: number;
}

export interface PortfolioCollection {
  id: string;
  name: string;
  slug: string;
  sessionDate: string;
  location: string;
  style: PortfolioStyle;
  lingerieBrand: string | null;
  archivedAt: string | null;
  photos: PortfolioPhoto[];
  models: PortfolioModel[];
}

export interface DriveEntry {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
}

export interface DriveFolderPage {
  folderId: string;
  folderName: string;
  entries: DriveEntry[];
  nextPageToken: string | null;
}

export interface CollectionDraft {
  id?: string;
  name: string;
  slug: string;
  sessionDate: string;
  location: string;
  style: PortfolioStyle;
  lingerieBrand: string;
  modelIds: string[];
  newModels: Array<{ name: string; profileUrl: string }>;
  driveImages: Array<{ id: string; name: string }>;
}
