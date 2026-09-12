import { refreshInstagramAccessToken } from "./oauthClient";
import { getInstagramDatabase } from "./repository";
import {
  listInstagramAccountsForTokenRefresh,
  updateInstagramAccountToken,
} from "./tokenRepository";

export const INSTAGRAM_TOKEN_REFRESH_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

interface RefreshableInstagramAccount {
  id: string;
  handle: string;
  access_token: string;
  token_expires_at: string | null;
}

interface TokenRefreshSummary {
  checked: number;
  refreshed: number;
  skipped: number;
  failedAccounts: string[];
}

const isDueForRefresh = (account: RefreshableInstagramAccount, now: Date) => {
  if (!account.token_expires_at) {
    return false;
  }

  const expiresAt = Date.parse(account.token_expires_at);
  if (!Number.isFinite(expiresAt) || expiresAt <= now.getTime()) {
    return false;
  }

  return expiresAt - now.getTime() <= INSTAGRAM_TOKEN_REFRESH_WINDOW_MS;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Instagram token refresh failed";

export const refreshInstagramAccounts = async (
  database: ReturnType<typeof getInstagramDatabase>,
  now = new Date(),
): Promise<TokenRefreshSummary> => {
  const accounts = await listInstagramAccountsForTokenRefresh(database);
  const accountsDueForRefresh = accounts.filter((account) =>
    isDueForRefresh(account, now),
  );
  const results = await Promise.all(
    accountsDueForRefresh.map(async (account) => {
      try {
        const token = await refreshInstagramAccessToken(account.access_token);
        await updateInstagramAccountToken(database, account.id, token);
        return { handle: account.handle, refreshed: true };
      } catch (error) {
        console.error("instagram_token_refresh_failed", {
          account: account.handle,
          error: getErrorMessage(error),
        });
        return { handle: account.handle, refreshed: false };
      }
    }),
  );
  const failedAccounts = results
    .filter((result) => !result.refreshed)
    .map((result) => result.handle);

  return {
    checked: accounts.length,
    refreshed: results.filter((result) => result.refreshed).length,
    skipped: accounts.length - accountsDueForRefresh.length,
    failedAccounts,
  };
};
