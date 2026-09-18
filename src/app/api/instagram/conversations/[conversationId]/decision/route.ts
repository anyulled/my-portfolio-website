import { getAuthenticatedOperator } from "@/services/instagram/auth";
import {
  assignLeadCorrelationToken,
  claimInstagramResponse,
  getInstagramConversationForDelivery,
  getInstagramDatabase,
  markInstagramResponseSent,
  releaseInstagramResponseClaim,
  setInstagramReviewDecision,
} from "@/services/instagram/repository";
import { getInstagramPublicUrl } from "@/services/instagram/config";
import { getInstagramFollowupDueAt } from "@/services/instagram/followups";
import { sendInstagramText } from "@/services/instagram/metaClient";
import { renderBoundedResponse } from "@/services/instagram/responseTemplates";
import { reviewDecisionSchema } from "@/services/instagram/types";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

const getSafeError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return {
      name: "UnknownError",
      message: "Unknown Instagram decision error",
    };
  }

  return {
    name: error.name,
    message: error.message
      .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
      .replace(
        /(access[_-]?token|client[_-]?secret|api[_-]?key|secret)[=:]\s*[^\s,;]+/gi,
        "$1=[REDACTED]",
      )
      .slice(0, 300),
  };
};

const isStaleReview = (error: unknown) =>
  error instanceof Error &&
  error.message === "Conversation is no longer awaiting review";

const parseDecisionBody = async (request: Request) => {
  try {
    const body: unknown = await request.json();
    return { body, valid: true as const };
  } catch {
    return { body: null, valid: false as const };
  }
};

const sendApprovedResponse = async (
  database: ReturnType<typeof getInstagramDatabase>,
  conversationId: string,
  decision: "model_form" | "pricing",
) => {
  const deliveryConversation = await getInstagramConversationForDelivery(
    database,
    conversationId,
  );
  const account = deliveryConversation.instagram_accounts;
  if (!account) {
    throw new Error("Instagram account is not configured");
  }

  const claimed = await claimInstagramResponse(
    database,
    conversationId,
    decision,
  );
  if (!claimed) {
    return false;
  }

  try {
    const leadToken =
      decision === "model_form"
        ? await assignLeadCorrelationToken(database, conversationId)
        : null;
    const path =
      decision === "model_form"
        ? `/booking-a-session?lead=${leadToken}`
        : "/pricing";
    const responseText = renderBoundedResponse(
      decision,
      deliveryConversation.detected_language,
      `${getInstagramPublicUrl()}${path}`,
    );
    await sendInstagramText(
      account.access_token,
      account.instagram_user_id,
      deliveryConversation.participant_id,
      responseText,
    );
    await markInstagramResponseSent(
      database,
      conversationId,
      decision === "pricing"
        ? getInstagramFollowupDueAt(deliveryConversation.last_message_at)
        : null,
    );
  } catch (error) {
    await releaseInstagramResponseClaim(
      database,
      conversationId,
      error instanceof Error ? error.message : "Instagram delivery failed",
    );
    throw error;
  }

  return true;
};

export async function POST(request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID();
  const operator = await getAuthenticatedOperator();
  if (!operator) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsedBody = await parseDecisionBody(request);
  if (!parsedBody.valid) {
    return NextResponse.json(
      {
        message: "Invalid decision request.",
        requestId,
        resolution: "Retry from the inbox.",
      },
      { status: 400 },
    );
  }
  const decision = reviewDecisionSchema.safeParse(
    typeof parsedBody.body === "object" && parsedBody.body !== null
      ? (parsedBody.body as { decision?: unknown }).decision
      : undefined,
  );
  if (!decision.success) {
    return NextResponse.json(
      { message: "Invalid review decision" },
      { status: 400 },
    );
  }

  const { conversationId } = await context.params;
  try {
    const database = getInstagramDatabase();
    const conversation = await setInstagramReviewDecision(
      database,
      conversationId,
      decision.data,
    );

    if (decision.data === "ignore") {
      return NextResponse.json({ conversation });
    }

    const responseSent = await sendApprovedResponse(
      database,
      conversationId,
      decision.data,
    );
    if (!responseSent) {
      return NextResponse.json(
        {
          message: "Conversation response was already claimed.",
          requestId,
          resolution: "Reload the inbox to see the current conversation state.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("instagram_conversation_decision_failed", {
      requestId,
      conversationId,
      decision: decision.data,
      error: getSafeError(error),
    });

    if (isStaleReview(error)) {
      return NextResponse.json(
        {
          message: "Conversation is no longer awaiting review.",
          requestId,
          resolution: "Reload the inbox to see the current conversation state.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message: "Unable to deliver the Instagram response.",
        requestId,
        resolution:
          "Retry the decision. If delivery still fails, check the connected Instagram account and Meta messaging permission.",
      },
      { status: 502 },
    );
  }
}
