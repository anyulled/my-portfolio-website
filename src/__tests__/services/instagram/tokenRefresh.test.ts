import { getInstagramDatabase } from "@/services/instagram/repository";
import { refreshInstagramAccessToken } from "@/services/instagram/oauthClient";
import {
  INSTAGRAM_TOKEN_REFRESH_WINDOW_MS,
  refreshInstagramAccounts,
} from "@/services/instagram/tokenRefresh";
import {
  listInstagramAccountsForTokenRefresh,
  updateInstagramAccountToken,
} from "@/services/instagram/tokenRepository";

jest.mock("@/services/instagram/repository", () => ({
  getInstagramDatabase: jest.fn(),
}));

jest.mock("@/services/instagram/tokenRepository", () => ({
  listInstagramAccountsForTokenRefresh: jest.fn(),
  updateInstagramAccountToken: jest.fn(),
}));

jest.mock("@/services/instagram/oauthClient", () => ({
  refreshInstagramAccessToken: jest.fn(),
}));

describe("refreshInstagramAccounts", () => {
  const database = {} as ReturnType<typeof getInstagramDatabase>;
  const now = new Date("2026-09-12T10:00:00.000Z");

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(updateInstagramAccountToken).mockResolvedValue(undefined);
  });

  it("refreshes active accounts within the refresh window", async () => {
    const tokenExpiresAt = new Date(
      now.getTime() + INSTAGRAM_TOKEN_REFRESH_WINDOW_MS,
    ).toISOString();
    jest.mocked(listInstagramAccountsForTokenRefresh).mockResolvedValue([
      {
        id: "account-id",
        handle: "anyulled",
        access_token: "current-token",
        token_expires_at: tokenExpiresAt,
      },
    ]);
    jest.mocked(refreshInstagramAccessToken).mockResolvedValue({
      accessToken: "refreshed-token",
      tokenExpiresAt: "2026-11-11T10:00:00.000Z",
    });

    const result = await refreshInstagramAccounts(database, now);

    expect(result).toEqual({
      checked: 1,
      refreshed: 1,
      skipped: 0,
      failedAccounts: [],
    });
    expect(refreshInstagramAccessToken).toHaveBeenCalledWith("current-token");
    expect(updateInstagramAccountToken).toHaveBeenCalledWith(
      database,
      "account-id",
      {
        accessToken: "refreshed-token",
        tokenExpiresAt: "2026-11-11T10:00:00.000Z",
      },
    );
  });

  it("skips accounts that are not eligible for refresh", async () => {
    jest.mocked(listInstagramAccountsForTokenRefresh).mockResolvedValue([
      {
        id: "future-id",
        handle: "anyulled",
        access_token: "future-token",
        token_expires_at: "2026-10-01T10:00:00.000Z",
      },
      {
        id: "missing-id",
        handle: "sensuelleboudoir",
        access_token: "missing-token",
        token_expires_at: null,
      },
      {
        id: "expired-id",
        handle: "anyulled",
        access_token: "expired-token",
        token_expires_at: "2026-09-11T10:00:00.000Z",
      },
      {
        id: "invalid-id",
        handle: "sensuelleboudoir",
        access_token: "invalid-token",
        token_expires_at: "not-a-date",
      },
    ]);

    const result = await refreshInstagramAccounts(database, now);

    expect(result).toEqual({
      checked: 4,
      refreshed: 0,
      skipped: 4,
      failedAccounts: [],
    });
    expect(refreshInstagramAccessToken).not.toHaveBeenCalled();
  });

  it("continues refreshing other accounts when one refresh fails", async () => {
    jest.mocked(listInstagramAccountsForTokenRefresh).mockResolvedValue([
      {
        id: "first-id",
        handle: "anyulled",
        access_token: "first-token",
        token_expires_at: "2026-09-20T10:00:00.000Z",
      },
      {
        id: "second-id",
        handle: "sensuelleboudoir",
        access_token: "second-token",
        token_expires_at: "2026-09-20T10:00:00.000Z",
      },
    ]);
    jest
      .mocked(refreshInstagramAccessToken)
      .mockRejectedValueOnce("Meta rejected the token")
      .mockResolvedValueOnce({
        accessToken: "second-refreshed-token",
        tokenExpiresAt: "2026-11-11T10:00:00.000Z",
      });

    const result = await refreshInstagramAccounts(database, now);

    expect(result).toEqual({
      checked: 2,
      refreshed: 1,
      skipped: 0,
      failedAccounts: ["anyulled"],
    });
    expect(updateInstagramAccountToken).toHaveBeenCalledTimes(1);
  });
});
