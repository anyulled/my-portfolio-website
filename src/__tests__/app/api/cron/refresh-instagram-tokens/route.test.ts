import { GET } from "@/app/api/cron/refresh-instagram-tokens/route";
import { getInstagramDatabase } from "@/services/instagram/repository";
import { refreshInstagramAccounts } from "@/services/instagram/tokenRefresh";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status ?? 200,
    })),
  },
}));

jest.mock("@/services/instagram/repository", () => ({
  getInstagramDatabase: jest.fn(),
}));

jest.mock("@/services/instagram/tokenRefresh", () => ({
  refreshInstagramAccounts: jest.fn(),
}));

describe("Instagram token refresh cron route", () => {
  const createRequest = (authorization?: string) =>
    ({
      headers: {
        get: (name: string) =>
          name === "authorization" ? (authorization ?? null) : null,
      },
    }) as unknown as Request;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
    jest.mocked(getInstagramDatabase).mockReturnValue({} as never);
  });

  it("rejects requests without the cron secret", async () => {
    const response = await GET(createRequest());

    expect(response.status).toBe(401);
  });

  it("returns the refresh summary for an authorized cron request", async () => {
    jest.mocked(refreshInstagramAccounts).mockResolvedValue({
      checked: 2,
      refreshed: 2,
      skipped: 0,
      failedAccounts: [],
    });

    const response = await GET(createRequest("Bearer cron-secret"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      checked: 2,
      refreshed: 2,
      skipped: 0,
      failedAccounts: [],
    });
  });

  it("returns service unavailable when an account refresh fails", async () => {
    jest.mocked(refreshInstagramAccounts).mockResolvedValue({
      checked: 2,
      refreshed: 1,
      skipped: 0,
      failedAccounts: ["anyulled"],
    });

    const response = await GET(createRequest("Bearer cron-secret"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      success: false,
      checked: 2,
      refreshed: 1,
      skipped: 0,
      failedAccounts: ["anyulled"],
    });
  });

  it("returns service unavailable when the refresh service cannot list accounts", async () => {
    jest
      .mocked(refreshInstagramAccounts)
      .mockRejectedValue(new Error("Supabase unavailable"));

    const response = await GET(createRequest("Bearer cron-secret"));

    expect(response.status).toBe(503);
  });
});
