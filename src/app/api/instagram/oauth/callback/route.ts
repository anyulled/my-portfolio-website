import { getAuthenticatedOperator } from "@/services/instagram/auth";
import {
  getInstagramOAuthConfig,
  parseInstagramOAuthState,
} from "@/services/instagram/config";
import {
  getInstagramDatabase,
  upsertInstagramAccount,
} from "@/services/instagram/repository";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!(await getAuthenticatedOperator())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) {
      throw new Error("Instagram OAuth response is incomplete");
    }
    const handle = parseInstagramOAuthState(state);
    const config = getInstagramOAuthConfig();
    const tokenResponse = await fetch(
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
    const tokenPayload: unknown = await tokenResponse.json();
    if (
      !tokenResponse.ok ||
      typeof tokenPayload !== "object" ||
      tokenPayload === null
    ) {
      throw new Error("Instagram token exchange failed");
    }
    const token = tokenPayload as { access_token?: unknown; user_id?: unknown };
    if (
      typeof token.access_token !== "string" ||
      typeof token.user_id !== "string"
    ) {
      throw new Error("Instagram token response is incomplete");
    }
    await upsertInstagramAccount(getInstagramDatabase(), {
      handle,
      instagram_user_id: token.user_id,
      access_token: token.access_token,
    });
    return NextResponse.redirect(
      new URL("/instagram?connected=1", request.url),
    );
  } catch {
    return NextResponse.redirect(
      new URL("/instagram?connected=0", request.url),
    );
  }
}
