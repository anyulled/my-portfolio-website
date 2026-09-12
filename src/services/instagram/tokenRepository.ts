import { getInstagramDatabase } from "./repository";
import type { InstagramHandle } from "./types";

export interface InstagramAccountTokenRow {
  id: string;
  handle: InstagramHandle;
  access_token: string;
  token_expires_at: string | null;
}

export const listInstagramAccountsForTokenRefresh = async (
  database: ReturnType<typeof getInstagramDatabase>,
): Promise<Array<InstagramAccountTokenRow>> => {
  const result = await database
    .from("instagram_accounts")
    .select("id, handle, access_token, token_expires_at")
    .eq("active", true);
  const data = result.data as unknown as Array<InstagramAccountTokenRow> | null;
  const { error } = result;

  if (error) {
    throw error;
  }

  return data ?? [];
};

export const updateInstagramAccountToken = async (
  database: ReturnType<typeof getInstagramDatabase>,
  accountId: string,
  token: { accessToken: string; tokenExpiresAt: string | null },
) => {
  const { error } = await database
    .from("instagram_accounts")
    .update({
      access_token: token.accessToken,
      token_expires_at: token.tokenExpiresAt,
    })
    .eq("id", accountId);

  if (error) {
    throw error;
  }
};
