import {
  parseInstagramWebhookPayload,
  processInstagramWebhookMessage,
} from "@/services/instagram/webhook";
import { NextResponse } from "next/server";

const getVerificationToken = () => {
  const token = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
  if (!token) {
    throw new Error("INSTAGRAM_WEBHOOK_VERIFY_TOKEN is required");
  }
  return token;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode !== "subscribe" || token !== getVerificationToken() || !challenge) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return new NextResponse(challenge);
}

export async function POST(request: Request) {
  try {
    const payload: unknown = await request.json();
    const messages = parseInstagramWebhookPayload(payload);
    const results = await Promise.allSettled(
      messages.map(processInstagramWebhookMessage),
    );
    const failures = results.filter(
      (result) => result.status === "rejected",
    ).length;

    return NextResponse.json(
      { received: messages.length, failures },
      { status: failures > 0 ? 503 : 200 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Instagram webhook processing failed" },
      { status: 503 },
    );
  }
}
