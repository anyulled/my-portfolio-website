import type { InstagramOAuthConfig } from "./config";

interface InstagramTokenRecord {
  access_token?: unknown;
  expires_in?: unknown;
}

interface InstagramTokenExchange {
  accessToken: string;
  instagramUserId: string;
  tokenExpiresAt: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getTokenRecord = (payload: unknown): InstagramTokenRecord | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const data = payload.data;
  if (Array.isArray(data) && isRecord(data[0])) {
    return data[0] as InstagramTokenRecord;
  }

  return payload as InstagramTokenRecord;
};

const getAccessToken = (payload: unknown) => {
  const record = getTokenRecord(payload);
  return typeof record?.access_token === "string" && record.access_token
    ? record.access_token
    : null;
};

const getRawUserId = (body: string) => {
  const match = body.match(/"user_id"\s*:\s*(?:"([^"]+)"|([0-9]+))/);
  return match?.[1] ?? match?.[2] ?? null;
};

const getExpiresIn = (payload: unknown) => {
  const record = getTokenRecord(payload);
  const value = record?.expires_in;
  const expiresIn = typeof value === "number" ? value : Number(value);
  return Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : null;
};

const readTokenResponse = async (response: Response) => {
  const body = await response.text();
  const payload = (() => {
    try {
      return JSON.parse(body) as unknown;
    } catch {
      return null;
    }
  })();
  return { body, payload };
};

const getTokenExpiresAt = (expiresIn: number | null) =>
  expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

export const exchangeInstagramAuthorizationCode = async (
  code: string,
  config: Pick<InstagramOAuthConfig, "appId" | "appSecret" | "redirectUri">,
): Promise<InstagramTokenExchange> => {
  const shortLivedResponse = await fetch(
    "https://api.instagram.com/oauth/access_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.appId,
        client_secret: config.appSecret,
        grant_type: "authorization_code",
        redirect_uri: config.redirectUri,
        code,
      }),
    },
  );
  const shortLivedPayload = await readTokenResponse(shortLivedResponse);
  const shortLivedToken = getAccessToken(shortLivedPayload.payload);
  const instagramUserId = getRawUserId(shortLivedPayload.body);
  if (!shortLivedResponse.ok || !shortLivedToken || !instagramUserId) {
    throw new Error(
      `Instagram authorization code exchange failed (${shortLivedResponse.status})`,
    );
  }

  const longLivedUrl = new URL("https://graph.instagram.com/access_token");
  longLivedUrl.searchParams.set("grant_type", "ig_exchange_token");
  longLivedUrl.searchParams.set("client_secret", config.appSecret);
  longLivedUrl.searchParams.set("access_token", shortLivedToken);
  const longLivedResponse = await fetch(longLivedUrl);
  const longLivedPayload = await readTokenResponse(longLivedResponse);
  const longLivedToken = getAccessToken(longLivedPayload.payload);
  if (!longLivedResponse.ok || !longLivedToken) {
    throw new Error(
      `Instagram long-lived token exchange failed (${longLivedResponse.status})`,
    );
  }

  return {
    accessToken: longLivedToken,
    instagramUserId,
    tokenExpiresAt: getTokenExpiresAt(getExpiresIn(longLivedPayload.payload)),
  };
};
