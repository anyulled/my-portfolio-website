import "server-only";

import { GoogleAuth } from "google-auth-library";
import type { DriveEntry, DriveFolderPage } from "./types";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";
const DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const MAX_PARENT_DEPTH = 30;

interface DriveFileResponse {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  size?: string;
}

interface DriveFilesResponse {
  files?: DriveFileResponse[];
  nextPageToken?: string;
}

const requiredEnvironmentValue = (
  name:
    | "GCP_PRIVATE_KEY"
    | "GCP_CLIENT_EMAIL"
    | "GCP_SERVICE_ACCOUNT_EMAIL"
    | "GOOGLE_DRIVE_TEARSHEETS_FOLDER_ID",
): string => {
  const value =
    name === "GCP_PRIVATE_KEY"
      ? process.env.GCP_PRIVATE_KEY
      : name === "GCP_CLIENT_EMAIL"
        ? process.env.GCP_CLIENT_EMAIL
        : name === "GCP_SERVICE_ACCOUNT_EMAIL"
          ? process.env.GCP_SERVICE_ACCOUNT_EMAIL
          : process.env.GOOGLE_DRIVE_TEARSHEETS_FOLDER_ID;
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

const getDriveAuthClient = async () => {
  const privateKey = requiredEnvironmentValue("GCP_PRIVATE_KEY")
    .replaceAll(String.raw`\n`, "\n")
    .replace(/^"|"$/g, "");
  const auth = new GoogleAuth({
    credentials: {
      client_email:
        process.env.GCP_CLIENT_EMAIL ||
        requiredEnvironmentValue("GCP_SERVICE_ACCOUNT_EMAIL"),
      private_key: privateKey,
    },
    scopes: [DRIVE_READONLY_SCOPE],
  });
  return auth.getClient();
};

const getDriveFile = async (fileId: string): Promise<DriveFileResponse> => {
  const authClient = await getDriveAuthClient();
  const response = await authClient.request<DriveFileResponse>({
    url: `${DRIVE_API}/files/${encodeURIComponent(fileId)}`,
    params: { fields: "id,name,mimeType,parents,size" },
  });
  return response.data;
};

const getRootFolder = () =>
  requiredEnvironmentValue("GOOGLE_DRIVE_TEARSHEETS_FOLDER_ID");

const isFolderWithinRoot = async (
  folderId: string,
  visited = new Set<string>(),
  depth = 0,
): Promise<boolean> => {
  const rootFolderId = getRootFolder();
  if (folderId === rootFolderId) return true;
  if (visited.has(folderId) || depth >= MAX_PARENT_DEPTH) return false;
  const nextVisited = new Set(visited).add(folderId);
  const file = await getDriveFile(folderId);
  if (file.mimeType !== DRIVE_FOLDER_MIME || !file.parents?.[0]) return false;
  return isFolderWithinRoot(file.parents[0], nextVisited, depth + 1);
};

export const listDriveFolder = async (
  folderId = getRootFolder(),
  pageToken?: string,
): Promise<DriveFolderPage> => {
  if (folderId !== getRootFolder() && !(await isFolderWithinRoot(folderId))) {
    throw new Error("The requested folder is outside the tearsheets library");
  }

  const authClient = await getDriveAuthClient();
  const response = await authClient.request<DriveFilesResponse>({
    url: `${DRIVE_API}/files`,
    params: {
      q: `'${folderId.replaceAll("'", "\\'")}' in parents and trashed = false`,
      fields: "nextPageToken,files(id,name,mimeType,parents,size)",
      orderBy: "folder,name",
      pageSize: 100,
      pageToken,
    },
  });
  const folder = await getDriveFile(folderId);
  const entries: DriveEntry[] = (response.data.files ?? [])
    .filter(
      (file) =>
        file.mimeType === DRIVE_FOLDER_MIME ||
        file.mimeType.startsWith("image/"),
    )
    .map((file) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      isFolder: file.mimeType === DRIVE_FOLDER_MIME,
    }));

  return {
    folderId,
    folderName: folder.name,
    entries,
    nextPageToken: response.data.nextPageToken ?? null,
  };
};

export const downloadDriveImage = async (
  fileId: string,
): Promise<{ name: string; mimeType: string; buffer: Buffer }> => {
  const file = await getDriveFile(fileId);
  if (!file.mimeType.startsWith("image/")) {
    throw new Error("Only image files can be added to a portfolio collection");
  }
  const isAllowed = (
    await Promise.all(
      (file.parents ?? []).map((parentId) => isFolderWithinRoot(parentId)),
    )
  ).some(Boolean);
  if (!isAllowed) {
    throw new Error("The selected image is outside the tearsheets library");
  }

  const authClient = await getDriveAuthClient();
  const response = await authClient.request<ArrayBuffer>({
    url: `${DRIVE_API}/files/${encodeURIComponent(fileId)}`,
    params: { alt: "media" },
    responseType: "arraybuffer",
  });

  return {
    name: file.name,
    mimeType: file.mimeType,
    buffer: Buffer.from(response.data),
  };
};
