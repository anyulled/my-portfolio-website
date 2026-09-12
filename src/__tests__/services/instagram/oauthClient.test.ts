import { exchangeInstagramAuthorizationCode } from "@/services/instagram/oauthClient";

const createResponse = (body: string, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  }) as Response;

describe("exchangeInstagramAuthorizationCode", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-12T10:00:00.000Z"));
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("accepts wrapped token responses and preserves numeric account ids", async () => {
    jest
      .mocked(global.fetch)
      .mockResolvedValueOnce(
        createResponse(
          '{"data":[{"access_token":"short-token","user_id":17841406439718884}]}',
        ),
      )
      .mockResolvedValueOnce(
        createResponse('{"access_token":"long-token","expires_in":3600}'),
      );

    const result = await exchangeInstagramAuthorizationCode("code", {
      appId: "app-id",
      appSecret: "app-secret",
      redirectUri: "https://boudoir.barcelona/api/instagram/oauth/callback",
    });

    expect(result).toEqual({
      accessToken: "long-token",
      instagramUserId: "17841406439718884",
      tokenExpiresAt: "2026-09-12T11:00:00.000Z",
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "https://api.instagram.com/oauth/access_token",
      expect.objectContaining({ method: "POST" }),
    );
    expect(String(jest.mocked(global.fetch).mock.calls[1][0])).toContain(
      "grant_type=ig_exchange_token",
    );
  });

  it("accepts a token response wrapped in a data object", async () => {
    jest
      .mocked(global.fetch)
      .mockResolvedValueOnce(
        createResponse(
          '{"data":{"access_token":"short-token","user_id":"instagram-user-id"}}',
        ),
      )
      .mockResolvedValueOnce(
        createResponse('{"access_token":"long-token","expires_in":3600}'),
      );

    const result = await exchangeInstagramAuthorizationCode("code", {
      appId: "app-id",
      appSecret: "app-secret",
      redirectUri: "https://boudoir.barcelona/api/instagram/oauth/callback",
    });

    expect(result.instagramUserId).toBe("instagram-user-id");
  });

  it("rejects an unsuccessful short-lived token exchange without exposing a response body", async () => {
    jest
      .mocked(global.fetch)
      .mockResolvedValueOnce(createResponse('{"error":"invalid"}', 400));

    await expect(
      exchangeInstagramAuthorizationCode("code", {
        appId: "app-id",
        appSecret: "app-secret",
        redirectUri: "https://boudoir.barcelona/api/instagram/oauth/callback",
      }),
    ).rejects.toThrow("Instagram authorization code exchange failed (400)");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("rejects an incomplete long-lived token response", async () => {
    jest
      .mocked(global.fetch)
      .mockResolvedValueOnce(
        createResponse('{"access_token":"short-token","user_id":"id"}'),
      )
      .mockResolvedValueOnce(createResponse('{"expires_in":3600}'));

    await expect(
      exchangeInstagramAuthorizationCode("code", {
        appId: "app-id",
        appSecret: "app-secret",
        redirectUri: "https://boudoir.barcelona/api/instagram/oauth/callback",
      }),
    ).rejects.toThrow("Instagram long-lived token exchange failed (200)");
  });
});
