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
import { NextResponse } from "next/server";

const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  return { name: "UnknownError", message: String(error) };
};

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
    const token = await exchangeInstagramAuthorizationCode(code, config);
    await upsertInstagramAccount(getInstagramDatabase(), {
      handle,
      instagram_user_id: token.instagramUserId,
      access_token: token.accessToken,
      token_expires_at: token.tokenExpiresAt,
    });
    return NextResponse.redirect(
      new URL("/instagram?connected=1", request.url),
    );
  } catch (error) {
    const requestId = crypto.randomUUID();
    console.error(
      JSON.stringify({
        event: "instagram_oauth_callback_failed",
        requestId,
        error: getErrorDetails(error),
      }),
    );
    const redirectUrl = new URL("/instagram", request.url);
    redirectUrl.searchParams.set("connected", "0");
    redirectUrl.searchParams.set("error", "oauth_failed");
    redirectUrl.searchParams.set("reference", requestId);
    return NextResponse.redirect(redirectUrl);
  }
}
