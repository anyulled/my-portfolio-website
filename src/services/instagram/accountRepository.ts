import { resolveInstagramUsername } from "./metaClient";
import type { InstagramDatabase } from "./repository";
import type { InstagramHandle } from "./types";

export interface InstagramAccountRow {
  id: string;
  handle: InstagramHandle;
  instagram_user_id: string;
  instagram_webhook_user_id: string | null;
  access_token: string;
}

type AccountIdentifierColumn =
  "instagram_user_id" | "instagram_webhook_user_id";

const instagramAccountSelection =
  "id, handle, instagram_user_id, instagram_webhook_user_id, access_token";

const getAccountByIdentifier = async (
  database: InstagramDatabase,
  column: AccountIdentifierColumn,
  candidateIds: string[],
) => {
  const result = await database
    .from("instagram_accounts")
    .select(instagramAccountSelection)
    .in(column, candidateIds)
    .eq("active", true)
    .maybeSingle();
  const data = result.data as unknown as InstagramAccountRow | null;

  if (result.error) {
    throw result.error;
  }

  return data;
};

const listActiveAccounts = async (database: InstagramDatabase) => {
  const result = await database
    .from("instagram_accounts")
    .select(instagramAccountSelection)
    .eq("active", true)
    .order("handle");
  const data = result.data as unknown as InstagramAccountRow[] | null;

  if (result.error) {
    throw result.error;
  }

  return data ?? [];
};

const saveWebhookIdentifier = async (
  database: InstagramDatabase,
  accountId: string,
  webhookUserId: string,
) => {
  const result = await database
    .from("instagram_accounts")
    .update({ instagram_webhook_user_id: webhookUserId })
    .eq("id", accountId);

  if (result.error) {
    throw result.error;
  }
};

const resolveAccountByMetaIdentity = async (
  database: InstagramDatabase,
  candidateIds: string[],
) => {
  const accounts = await listActiveAccounts(database);

  for (const candidateId of candidateIds) {
    for (const account of accounts) {
      const username = await resolveInstagramUsername(
        account.access_token,
        candidateId,
      );
      if (username?.toLowerCase() !== account.handle.toLowerCase()) {
        continue;
      }

      await saveWebhookIdentifier(database, account.id, candidateId);
      return { ...account, instagram_webhook_user_id: candidateId };
    }
  }

  return null;
};

export const findInstagramAccount = async (
  database: InstagramDatabase,
  instagramUserIds: string[],
): Promise<InstagramAccountRow> => {
  const candidateIds = Array.from(new Set(instagramUserIds));
  if (candidateIds.length === 0) {
    throw new Error("Instagram account identifier is missing");
  }

  const accountByApiId = await getAccountByIdentifier(
    database,
    "instagram_user_id",
    candidateIds,
  );
  if (accountByApiId) {
    return accountByApiId;
  }

  const accountByWebhookId = await getAccountByIdentifier(
    database,
    "instagram_webhook_user_id",
    candidateIds,
  );
  if (accountByWebhookId) {
    return accountByWebhookId;
  }

  const resolvedAccount = await resolveAccountByMetaIdentity(
    database,
    candidateIds,
  );
  if (resolvedAccount) {
    return resolvedAccount;
  }

  throw new Error("Instagram account is not configured");
};

export const upsertInstagramAccount = async (
  database: InstagramDatabase,
  account: Pick<
    InstagramAccountRow,
    "handle" | "instagram_user_id" | "access_token"
  > & { token_expires_at: string | null },
) => {
  const { error } = await database.from("instagram_accounts").upsert(
    {
      handle: account.handle,
      instagram_user_id: account.instagram_user_id,
      access_token: account.access_token,
      token_expires_at: account.token_expires_at,
      active: true,
    },
    { onConflict: "handle" },
  );
  if (error) {
    throw error;
  }
};
