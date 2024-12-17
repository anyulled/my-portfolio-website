import { createFlickr } from "flickr-sdk";
import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

const consumerKey = process.env.FLICKR_API_KEY!;
const consumerSecret = process.env.FLICKER_SECRET_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestToken = searchParams.get("oauth_token");
  const oauthVerifier = searchParams.get("oauth_verifier");

  if (!requestToken || !oauthVerifier) {
    return NextResponse.json(
      { error: "Missing query parameters" },
      { status: 400 },
    );
  }

  const requestTokenSecret = await kv.get<string>(
    `oauth:requestToken:${requestToken}`,
  );
  if (!requestTokenSecret) {
    return NextResponse.json(
      { error: "Request token not found" },
      { status: 400 },
    );
  }

  const { oauth } = createFlickr({
    consumerKey,
    consumerSecret,
    oauthToken: requestToken,
    oauthTokenSecret: requestTokenSecret,
  });

  try {
    const { nsid, oauthToken, oauthTokenSecret } =
      await oauth.verify(oauthVerifier);

    await kv.set(`oauth:user:${nsid}`, {
      oauthToken,
      oauthTokenSecret,
    });

    return NextResponse.redirect(new URL(`/logged?success=true`));
  } catch (err) {
    console.error("Request error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
