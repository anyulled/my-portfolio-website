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
import { sendInstagramText } from "@/services/instagram/metaClient";
import { renderBoundedResponse } from "@/services/instagram/responseTemplates";
import { reviewDecisionSchema } from "@/services/instagram/types";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

const sendApprovedResponse = async (
  database: ReturnType<typeof getInstagramDatabase>,
  conversationId: string,
  decision: "model_form" | "pricing",
) => {
  const deliveryConversation = await getInstagramConversationForDelivery(
    database,
    conversationId,
  );
  const account = deliveryConversation.instagram_accounts[0];
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
    await markInstagramResponseSent(database, conversationId);
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
  const operator = await getAuthenticatedOperator();
  if (!operator) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const decision = reviewDecisionSchema.safeParse(
    typeof body === "object" && body !== null
      ? (body as { decision?: unknown }).decision
      : undefined,
  );
  if (!decision.success) {
    return NextResponse.json(
      { message: "Invalid review decision" },
      { status: 400 },
    );
  }

  try {
    const { conversationId } = await context.params;
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
        { message: "Conversation response was already claimed" },
        { status: 409 },
      );
    }

    return NextResponse.json({ conversation });
  } catch {
    return NextResponse.json(
      { message: "Conversation is no longer awaiting review" },
      { status: 409 },
    );
  }
}
