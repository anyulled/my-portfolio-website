import { getInstagramDatabase } from "@/services/instagram/repository";
import {
  listInstagramAccountsForTokenRefresh,
  updateInstagramAccountToken,
} from "@/services/instagram/tokenRepository";

describe("Instagram token repository", () => {
  const database = {
    from: jest.fn(),
  } as unknown as ReturnType<typeof getInstagramDatabase>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists active accounts and their expiry metadata", async () => {
    const result = {
      data: [
        {
          id: "account-id",
          handle: "anyulled",
          access_token: "token",
          token_expires_at: "2026-09-20T10:00:00.000Z",
        },
      ],
      error: null,
    };
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue(result),
    };
    jest.mocked(database.from).mockReturnValue(query as never);

    await expect(
      listInstagramAccountsForTokenRefresh(database),
    ).resolves.toEqual(result.data);
    expect(query.select).toHaveBeenCalledWith(
      "id, handle, access_token, token_expires_at",
    );
    expect(query.eq).toHaveBeenCalledWith("active", true);
  });

  it("returns an empty list when Supabase has no active accounts", async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    jest.mocked(database.from).mockReturnValue(query as never);

    await expect(
      listInstagramAccountsForTokenRefresh(database),
    ).resolves.toEqual([]);
  });

  it("propagates account listing errors", async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: null,
        error: new Error("Supabase unavailable"),
      }),
    };
    jest.mocked(database.from).mockReturnValue(query as never);

    await expect(
      listInstagramAccountsForTokenRefresh(database),
    ).rejects.toThrow("Supabase unavailable");
  });

  it("updates the refreshed token and expiry", async () => {
    const query = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    jest.mocked(database.from).mockReturnValue(query as never);

    await expect(
      updateInstagramAccountToken(database, "account-id", {
        accessToken: "refreshed-token",
        tokenExpiresAt: "2026-11-11T10:00:00.000Z",
      }),
    ).resolves.toBeUndefined();
    expect(query.update).toHaveBeenCalledWith({
      access_token: "refreshed-token",
      token_expires_at: "2026-11-11T10:00:00.000Z",
    });
    expect(query.eq).toHaveBeenCalledWith("id", "account-id");
  });

  it("propagates token update errors", async () => {
    const query = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        error: new Error("Supabase update failed"),
      }),
    };
    jest.mocked(database.from).mockReturnValue(query as never);

    await expect(
      updateInstagramAccountToken(database, "account-id", {
        accessToken: "refreshed-token",
        tokenExpiresAt: "2026-11-11T10:00:00.000Z",
      }),
    ).rejects.toThrow("Supabase update failed");
  });
});
