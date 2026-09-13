import {
  parseInstagramWebhookPayload,
  processInstagramWebhookMessage,
} from "@/services/instagram/webhook";
import { NextResponse } from "next/server";

type WebhookStage =
  | "account_lookup"
  | "classification"
  | "persistence"
  | "response_claim"
  | "response_delivery"
  | "unknown";

const stageResolutions = new Map<WebhookStage, string>([
  [
    "account_lookup",
    "Reconnect the Instagram account or verify the account identifier delivered by Meta.",
  ],
  [
    "classification",
    "Verify GROQ_API_KEY and GROQ_MODEL in the production environment.",
  ],
  [
    "persistence",
    "Verify the Instagram Supabase migration and service-role connection.",
  ],
  [
    "response_claim",
    "Inspect the Instagram conversation response state in Supabase.",
  ],
  [
    "response_delivery",
    "Verify the Instagram access token, messaging permission, recipient ID, and Graph API version.",
  ],
  [
    "unknown",
    "Inspect the Vercel log details for the failing webhook request.",
  ],
]);

const getSafeError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return {
      name: "UnknownError",
      message: "Unknown webhook processing error",
    };
  }

  const message = error.message
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(
      /(access[_-]?token|client[_-]?secret|api[_-]?key|secret)[=:]\s*[^\s,;]+/gi,
      "$1=[REDACTED]",
    )
    .slice(0, 300);

  return { name: error.name, message };
};

const getStage = (error: unknown): WebhookStage => {
  if (typeof error !== "object" || error === null || !("stage" in error)) {
    return "unknown";
  }

  const stage = error.stage;
  return typeof stage === "string" &&
    stageResolutions.has(stage as WebhookStage)
    ? (stage as WebhookStage)
    : "unknown";
};

const getStageResolution = (stage: WebhookStage) => {
  return stageResolutions.get(stage) as string;
};

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
  const requestId = crypto.randomUUID();
  try {
    const payload: unknown = await request.json();
    const messages = parseInstagramWebhookPayload(payload);
    const results = await Promise.allSettled(
      messages.map(processInstagramWebhookMessage),
    );
    const failures = results.filter(
      (result) => result.status === "rejected",
    ).length;
    results.forEach((result, messageIndex) => {
      if (result.status !== "rejected") {
        return;
      }

      const stage = getStage(result.reason);
      const message = messages.at(messageIndex) as (typeof messages)[number];
      console.error(
        JSON.stringify({
          event: "instagram_webhook_message_failed",
          requestId,
          messageIndex,
          accountInstagramUserId: message.accountInstagramUserId,
          messageId: message.messageId,
          stage,
          resolution: getStageResolution(stage),
          error: getSafeError(result.reason),
        }),
      );
    });

    return NextResponse.json(
      { received: messages.length, failures, requestId },
      { status: failures > 0 ? 503 : 200 },
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "instagram_webhook_request_failed",
        requestId,
        error: getSafeError(error),
      }),
    );
    return NextResponse.json(
      {
        success: false,
        message: "Instagram webhook processing failed",
        requestId,
      },
      { status: 503 },
    );
  }
}
