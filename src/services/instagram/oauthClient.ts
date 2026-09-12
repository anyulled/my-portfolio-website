import type { InstagramOAuthConfig } from "./config";

interface InstagramTokenRecord {
  access_token?: unknown;
  expires_in?: unknown;
  user_id?: unknown;
}

interface InstagramTokenExchange {
  accessToken: string;
  instagramUserId: string;
  tokenExpiresAt: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getTokenRecord = (payload: unknown): InstagramTokenRecord | null => {
  if (Array.isArray(payload) && isRecord(payload[0])) {
    return payload[0] as InstagramTokenRecord;
  }

  if (!isRecord(payload)) {
    return null;
  }

  const data = payload.data;
  if (Array.isArray(data) && isRecord(data[0])) {
    return data[0] as InstagramTokenRecord;
  }
  if (isRecord(data)) {
    return data as InstagramTokenRecord;
  }

  return payload as InstagramTokenRecord;
};

const getAccessToken = (payload: unknown) => {
  const record = getTokenRecord(payload);
  return typeof record?.access_token === "string" && record.access_token
    ? record.access_token
    : null;
};

const getRawFieldValue = (body: string, field: "id" | "user_id") => {
  const match =
    field === "id"
      ? body.match(/"id"\s*:\s*(?:"([^"]+)"|([0-9]+))/)
      : body.match(/"user_id"\s*:\s*(?:"([^"]+)"|([0-9]+))/);
  return match?.[1] ?? match?.[2] ?? null;
};

const getRawUserId = (body: string) => getRawFieldValue(body, "user_id");

const getInstagramUserIdFromProfile = async (
  accessToken: string,
  graphApiVersion: string,
) => {
  const profileUrl = new URL(
    `https://graph.instagram.com/${graphApiVersion}/me`,
  );
  profileUrl.searchParams.set("fields", "id");
  const response = await fetch(profileUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = await readTokenResponse(response);
  const instagramUserId = getRawFieldValue(profile.body, "id");
  if (!response.ok || !instagramUserId) {
    const responseError = getResponseError(profile.payload);
    throw new Error(
      `Instagram profile lookup failed (${response.status}); missing=${instagramUserId ? "none" : "id"}; keys=${getResponseKeys(profile.payload)}${responseError ? `; provider=${responseError}` : ""}`,
    );
  }
  return instagramUserId;
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

const getResponseKeys = (payload: unknown) => {
  const record = getTokenRecord(payload);
  return record ? Object.keys(record).sort().join(",") : "none";
};

const getResponseError = (payload: unknown) => {
  if (!isRecord(payload)) {
    return null;
  }

  const getMessage = (value: unknown) => {
    if (!isRecord(value)) {
      return null;
    }
    const message = value.error_message ?? value.message;
    return typeof message === "string" && message ? message : null;
  };

  return getMessage(payload) ?? getMessage(payload.error);
};

export const exchangeInstagramAuthorizationCode = async (
  code: string,
  config: Pick<
    InstagramOAuthConfig,
    "appId" | "appSecret" | "redirectUri" | "graphApiVersion"
  >,
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
  if (!shortLivedResponse.ok || !shortLivedToken) {
    const missingFields = [!shortLivedToken ? "access_token" : null]
      .filter((field): field is string => Boolean(field))
      .join(",");
    const responseError = getResponseError(shortLivedPayload.payload);
    throw new Error(
      `Instagram authorization code exchange failed (${shortLivedResponse.status}); missing=${missingFields || "none"}; keys=${getResponseKeys(shortLivedPayload.payload)}${responseError ? `; provider=${responseError}` : ""}`,
    );
  }

  const instagramUserId =
    getRawUserId(shortLivedPayload.body) ??
    (await getInstagramUserIdFromProfile(
      shortLivedToken,
      config.graphApiVersion,
    ));

  const longLivedUrl = new URL("https://graph.instagram.com/access_token");
  longLivedUrl.searchParams.set("grant_type", "ig_exchange_token");
  longLivedUrl.searchParams.set("client_secret", config.appSecret);
  longLivedUrl.searchParams.set("access_token", shortLivedToken);
  const longLivedResponse = await fetch(longLivedUrl);
  const longLivedPayload = await readTokenResponse(longLivedResponse);
  const longLivedToken = getAccessToken(longLivedPayload.payload);
  if (!longLivedResponse.ok || !longLivedToken) {
    const responseError = getResponseError(longLivedPayload.payload);
    throw new Error(
      `Instagram long-lived token exchange failed (${longLivedResponse.status}); missing=${longLivedToken ? "none" : "access_token"}; keys=${getResponseKeys(longLivedPayload.payload)}${responseError ? `; provider=${responseError}` : ""}`,
    );
  }

  return {
    accessToken: longLivedToken,
    instagramUserId,
    tokenExpiresAt: getTokenExpiresAt(getExpiresIn(longLivedPayload.payload)),
  };
};

export const refreshInstagramAccessToken = async (accessToken: string) => {
  const refreshUrl = new URL(
    "https://graph.instagram.com/refresh_access_token",
  );
  refreshUrl.searchParams.set("grant_type", "ig_refresh_token");
  refreshUrl.searchParams.set("access_token", accessToken);

  const response = await fetch(refreshUrl);
  const payload = await readTokenResponse(response);
  const refreshedToken = getAccessToken(payload.payload);
  if (!response.ok || !refreshedToken) {
    const responseError = getResponseError(payload.payload);
    throw new Error(
      `Instagram access token refresh failed (${response.status}); missing=${refreshedToken ? "none" : "access_token"}; keys=${getResponseKeys(payload.payload)}${responseError ? `; provider=${responseError}` : ""}`,
    );
  }

  return {
    accessToken: refreshedToken,
    tokenExpiresAt: getTokenExpiresAt(getExpiresIn(payload.payload)),
  };
};
