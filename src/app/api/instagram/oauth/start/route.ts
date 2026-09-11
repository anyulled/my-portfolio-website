import { getAuthenticatedOperator } from "@/services/instagram/auth";
import {
  createInstagramOAuthState,
  getInstagramOAuthConfig,
  getInstagramHandle,
  getInstagramPublicUrl,
} from "@/services/instagram/config";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!(await getAuthenticatedOperator())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const handle = getInstagramHandle(
    new URL(request.url).searchParams.get("account") ?? "",
  );
  const config = getInstagramOAuthConfig();
  const authorizationUrl = new URL("https://www.instagram.com/oauth/authorize");
  authorizationUrl.searchParams.set("client_id", config.appId);
  authorizationUrl.searchParams.set(
    "redirect_uri",
    config.redirectUri ||
      `${getInstagramPublicUrl()}/api/instagram/oauth/callback`,
  );
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", config.scopes);
  authorizationUrl.searchParams.set("state", createInstagramOAuthState(handle));
  return NextResponse.redirect(authorizationUrl);
}
