import { instagramHandleSchema, type InstagramHandle } from "./types";
import { createHmac, timingSafeEqual } from "node:crypto";

export const getInstagramPublicUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://boudoir.barcelona";

export const getInstagramModel = () =>
  process.env.GROQ_MODEL ?? "openai/gpt-oss-20b";

export const getInstagramHandle = (value: string): InstagramHandle => {
  const result = instagramHandleSchema.safeParse(value);
  if (!result.success) {
    throw new Error("Unsupported Instagram account handle");
  }
  return result.data;
};

export interface InstagramOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
  scopes: string;
  graphApiVersion: string;
}

export const getInstagramAccountHandle = (instagramUserId: string) => {
  if (process.env.INSTAGRAM_ANYULLED_USER_ID === instagramUserId) {
    return getInstagramHandle("anyulled");
  }

  if (process.env.INSTAGRAM_SENSUELLEBOUDOIR_USER_ID === instagramUserId) {
    return getInstagramHandle("sensuelleboudoir");
  }

  throw new Error("Instagram account is not configured");
};

const getRequiredEnvironmentValue = (
  name: string,
  value: string | undefined,
) => {
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

export const createInstagramOAuthState = (handle: InstagramHandle) => {
  const payload = `${handle}.${Date.now()}`;
  const signature = createHmac(
    "sha256",
    getRequiredEnvironmentValue(
      "INSTAGRAM_OAUTH_STATE_SECRET",
      process.env.INSTAGRAM_OAUTH_STATE_SECRET,
    ),
  )
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
};

export const parseInstagramOAuthState = (state: string) => {
  const parts = state.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid Instagram OAuth state");
  }
  const [handle, timestamp, signature] = parts;
  const payload = `${handle}.${timestamp}`;
  const expected = createHmac(
    "sha256",
    getRequiredEnvironmentValue(
      "INSTAGRAM_OAUTH_STATE_SECRET",
      process.env.INSTAGRAM_OAUTH_STATE_SECRET,
    ),
  )
    .update(payload)
    .digest("hex");
  if (
    !signature ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ||
    Number.isNaN(Number(timestamp)) ||
    Date.now() - Number(timestamp) > 10 * 60 * 1000
  ) {
    throw new Error("Invalid or expired Instagram OAuth state");
  }
  return getInstagramHandle(handle);
};

export const getInstagramOAuthConfig = (): InstagramOAuthConfig => ({
  appId: getRequiredEnvironmentValue("META_APP_ID", process.env.META_APP_ID),
  appSecret: getRequiredEnvironmentValue(
    "META_APP_SECRET",
    process.env.META_APP_SECRET,
  ),
  redirectUri: getRequiredEnvironmentValue(
    "META_REDIRECT_URI",
    process.env.META_REDIRECT_URI,
  ),
  scopes: getRequiredEnvironmentValue(
    "META_INSTAGRAM_SCOPES",
    process.env.META_INSTAGRAM_SCOPES,
  ),
  graphApiVersion: getRequiredEnvironmentValue(
    "INSTAGRAM_GRAPH_API_VERSION",
    process.env.INSTAGRAM_GRAPH_API_VERSION,
  ),
});
