jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, options?: { status?: number }) => ({
      status: options?.status ?? 200,
      json: async () => body,
    }),
    redirect: (url: URL) => ({ status: 307, url: url.toString() }),
  },
}));

jest.mock("@/services/instagram/auth", () => ({
  getAuthenticatedOperator: jest.fn(),
}));

jest.mock("@/services/instagram/config", () => ({
  getInstagramOAuthConfig: jest.fn(),
  parseInstagramOAuthState: jest.fn(),
}));

jest.mock("@/services/instagram/oauthClient", () => ({
  exchangeInstagramAuthorizationCode: jest.fn(),
}));

jest.mock("@/services/instagram/repository", () => ({
  getInstagramDatabase: jest.fn(),
  upsertInstagramAccount: jest.fn(),
}));

import { GET } from "@/app/api/instagram/oauth/callback/route";
import { getAuthenticatedOperator } from "@/services/instagram/auth";
import {
  getInstagramOAuthConfig,
  parseInstagramOAuthState,
} from "@/services/instagram/config";
import { exchangeInstagramAuthorizationCode } from "@/services/instagram/oauthClient";
import {
  getInstagramDatabase,
  upsertInstagramAccount,
} from "@/services/instagram/repository";

const request = {
  url: "https://boudoir.barcelona/api/instagram/oauth/callback?code=code&state=state",
} as Request;

describe("Instagram OAuth callback", () => {
  beforeEach(() => {
    jest
      .mocked(getAuthenticatedOperator)
      .mockResolvedValue({ id: "operator" } as never);
    jest.mocked(getInstagramOAuthConfig).mockReturnValue({
      appId: "app-id",
      appSecret: "app-secret",
      redirectUri: "https://boudoir.barcelona/api/instagram/oauth/callback",
      scopes: "instagram_business_basic",
      graphApiVersion: "v25.0",
    });
    jest.mocked(parseInstagramOAuthState).mockReturnValue("anyulled");
    jest.mocked(getInstagramDatabase).mockReturnValue({} as never);
    jest.mocked(exchangeInstagramAuthorizationCode).mockResolvedValue({
      accessToken: "long-token",
      instagramUserId: "instagram-user-id",
      tokenExpiresAt: "2026-11-11T10:00:00.000Z",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("stores the long-lived account token and redirects to the inbox", async () => {
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.url).toBe(
      "https://boudoir.barcelona/instagram?connected=1",
    );
    expect(upsertInstagramAccount).toHaveBeenCalledWith(
      {},
      {
        handle: "anyulled",
        instagram_user_id: "instagram-user-id",
        access_token: "long-token",
        token_expires_at: "2026-11-11T10:00:00.000Z",
      },
    );
  });

  it("logs a safe reference and redirects with a recoverable error", async () => {
    jest
      .mocked(exchangeInstagramAuthorizationCode)
      .mockRejectedValue(
        new Error("Instagram long-lived token exchange failed (400)"),
      );
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    const response = await GET(request);
    const redirectUrl = new URL(response.url);

    expect(response.status).toBe(307);
    expect(redirectUrl.pathname).toBe("/instagram");
    expect(redirectUrl.searchParams.get("connected")).toBe("0");
    expect(redirectUrl.searchParams.get("error")).toBe("oauth_failed");
    expect(redirectUrl.searchParams.get("reference")).toEqual(
      expect.any(String),
    );
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('"event":"instagram_oauth_callback_failed"'),
    );
    expect(consoleError.mock.calls[0][0]).not.toContain("long-token");
    consoleError.mockRestore();
  });
});
