import { createFlickr } from "flickr-sdk";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

const consumerKey = process.env.FLICKR_API_KEY!;
const consumerSecret = process.env.FLICKER_SECRET_KEY!;

export async function GET() {
  const { oauth } = createFlickr({
    consumerKey,
    consumerSecret,
    oauthToken: false,
    oauthTokenSecret: false,
  });

  try {
    const { requestToken, requestTokenSecret } = await oauth.request(
      `https://localhost:3000/api/oauth/callback`,
    );

    await kv.set(`oauth:requestToken:${requestToken}`, requestTokenSecret);

    const redirectUrl = oauth.authorizeUrl(requestToken, "read");
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
