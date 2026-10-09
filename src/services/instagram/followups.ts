import {
  beginInstagramFollowupDelivery,
  cancelInstagramFollowup,
  claimInstagramFollowup,
  listInstagramFollowupCandidates,
  markInstagramFollowupForReconciliation,
  markInstagramFollowupSent,
  releaseInstagramFollowupClaim,
} from "./followupRepository";
import {
  getInstagramDatabase,
  getInstagramInitialInboundMessage,
} from "./repository";
import { getInstagramPublicUrl } from "./config";
import { sendInstagramText } from "./metaClient";
import { generateInstagramReply } from "./replies";
import type { InstagramFollowupCandidate } from "./types";

export const INSTAGRAM_FOLLOWUP_DELAY_MS = 22 * 60 * 60 * 1000;
export const INSTAGRAM_FOLLOWUP_WINDOW_MS = 24 * 60 * 60 * 1000;
export const INSTAGRAM_FOLLOWUP_SAFETY_MARGIN_MS = 30 * 60 * 1000;
export const INSTAGRAM_FOLLOWUP_MAX_ATTEMPTS = 3;
export const INSTAGRAM_FOLLOWUP_BATCH_SIZE = 20;

interface FollowupSummary {
  candidates: number;
  sent: number;
  cancelled: number;
  failed: number;
  reconciled: number;
}

export const getInstagramFollowupDueAt = (messageTimestamp: string) =>
  new Date(
    new Date(messageTimestamp).getTime() + INSTAGRAM_FOLLOWUP_DELAY_MS,
  ).toISOString();

const getFollowupCutoffAt = (lastMessageAt: string) =>
  new Date(
    new Date(lastMessageAt).getTime() +
      INSTAGRAM_FOLLOWUP_WINDOW_MS -
      INSTAGRAM_FOLLOWUP_SAFETY_MARGIN_MS,
  );

const getErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message.slice(0, 300)
    : "Instagram follow-up failed";

const sendFollowup = async (
  candidate: InstagramFollowupCandidate,
  responseText: string,
) => {
  try {
    const delivery = await sendInstagramText(
      candidate.account.accessToken,
      candidate.account.instagramUserId,
      candidate.participantId,
      responseText,
    );
    return { delivery } as const;
  } catch (error) {
    return { error } as const;
  }
};

const cancelIneligibleFollowup = async (
  database: ReturnType<typeof getInstagramDatabase>,
  candidate: InstagramFollowupCandidate,
  now: Date,
  cutoffAt: Date,
) => {
  const confidenceRequiresReview =
    !Number.isFinite(candidate.confidence) || candidate.confidence <= 0.9;
  const windowReason =
    now >= cutoffAt ? "Instagram follow-up window is closing" : null;
  const reason = confidenceRequiresReview
    ? "Instagram confidence requires manual review"
    : windowReason;
  if (!reason) return false;
  await cancelInstagramFollowup(database, candidate.id, reason);
  return true;
};

const prepareFollowup = async (
  database: ReturnType<typeof getInstagramDatabase>,
  candidate: InstagramFollowupCandidate,
  claimToken: string,
  now: Date,
) => {
  if (candidate.deliveryStartedAt) {
    await beginInstagramFollowupDelivery(
      database,
      candidate.id,
      claimToken,
      now.toISOString(),
      candidate.deliveryStartedAt,
    );
    return { reconciled: true } as const;
  }
  try {
    const sourceMessage = await getInstagramInitialInboundMessage(
      database,
      candidate.id,
    );
    return await generateInstagramReply(
      "pricing_followup",
      candidate.detectedLanguage,
      sourceMessage.message_text,
      `${getInstagramPublicUrl()}/pricing`,
    );
  } catch (error) {
    await releaseInstagramFollowupClaim(
      database,
      candidate.id,
      claimToken,
      getErrorMessage(error),
      candidate.followUpAttempts + 1 >= INSTAGRAM_FOLLOWUP_MAX_ATTEMPTS,
    );
    return null;
  }
};

type FollowupOutcome =
  "sent" | "cancelled" | "failed" | "skipped" | "reconciled";

const processFollowupCandidate = async (
  database: ReturnType<typeof getInstagramDatabase>,
  candidate: InstagramFollowupCandidate,
  now: Date,
): Promise<FollowupOutcome> => {
  const cutoffAt = getFollowupCutoffAt(candidate.lastMessageAt);
  if (await cancelIneligibleFollowup(database, candidate, now, cutoffAt)) {
    return "cancelled";
  }

  const claimToken = crypto.randomUUID();
  const claimed = await claimInstagramFollowup(
    database,
    candidate.id,
    candidate.followUpAttempts + 1,
    now.toISOString(),
    claimToken,
  );
  if (!claimed) {
    return "skipped";
  }

  const responseText = await prepareFollowup(
    database,
    candidate,
    claimToken,
    now,
  );
  if (!responseText) {
    return "failed";
  }
  if (typeof responseText !== "string") {
    return "reconciled";
  }

  const deliveryStarted = await beginInstagramFollowupDelivery(
    database,
    candidate.id,
    claimToken,
    now.toISOString(),
    candidate.deliveryStartedAt,
  );
  if (!deliveryStarted) {
    return "skipped";
  }

  const deliveryResult = await sendFollowup(candidate, responseText);
  if ("error" in deliveryResult) {
    const errorMessage = getErrorMessage(deliveryResult.error);
    const shouldStop =
      candidate.followUpAttempts + 1 >= INSTAGRAM_FOLLOWUP_MAX_ATTEMPTS;
    await releaseInstagramFollowupClaim(
      database,
      candidate.id,
      claimToken,
      errorMessage,
      shouldStop,
    );
    return "failed";
  }

  const { delivery } = deliveryResult;
  const providerMessageId = delivery.message_id;
  if (!providerMessageId) {
    await markInstagramFollowupForReconciliation(
      database,
      candidate.id,
      claimToken,
      null,
      "Instagram delivery identifier was not returned",
    );
    return "failed";
  }

  try {
    const finalized = await markInstagramFollowupSent(
      database,
      candidate.id,
      claimToken,
      providerMessageId,
    );
    if (finalized) {
      return "sent";
    }

    return "failed";
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    await markInstagramFollowupForReconciliation(
      database,
      candidate.id,
      claimToken,
      providerMessageId,
      errorMessage,
    );
    return "failed";
  }
};

export const processInstagramFollowups = async (
  database = getInstagramDatabase(),
  now = new Date(),
): Promise<FollowupSummary> => {
  const candidates = await listInstagramFollowupCandidates(
    database,
    now.toISOString(),
    INSTAGRAM_FOLLOWUP_BATCH_SIZE,
  );
  const initialSummary: FollowupSummary = {
    candidates: candidates.length,
    sent: 0,
    cancelled: 0,
    failed: 0,
    reconciled: 0,
  };
  return candidates.reduce(async (previousSummary, candidate) => {
    const summary = await previousSummary;
    const outcome = await processFollowupCandidate(database, candidate, now);
    return {
      ...summary,
      sent: summary.sent + Number(outcome === "sent"),
      cancelled: summary.cancelled + Number(outcome === "cancelled"),
      failed: summary.failed + Number(outcome === "failed"),
      reconciled: summary.reconciled + Number(outcome === "reconciled"),
    };
  }, Promise.resolve(initialSummary));
};
