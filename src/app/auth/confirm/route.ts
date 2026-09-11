import { createInstagramAuthClient } from "@/services/instagram/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const redirectUrl = new URL("/instagram", url.origin);

  if (tokenHash && type === "email") {
    const client = await createInstagramAuthClient();
    const { error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type: "email",
    });
    if (!error) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  redirectUrl.pathname = "/instagram/login";
  redirectUrl.searchParams.set("error", "confirmation_failed");
  return NextResponse.redirect(redirectUrl);
}
