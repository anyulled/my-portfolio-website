import {
  claimInstagramFollowup,
  listInstagramFollowupCandidates,
  markInstagramFollowupSent,
  releaseInstagramFollowupClaim,
} from "./followupRepository";
import { getInstagramDatabase } from "./repository";
import { getInstagramPublicUrl } from "./config";
import { sendInstagramText } from "./metaClient";
import { renderPricingFollowup } from "./responseTemplates";

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

export const processInstagramFollowups = async (
  database = getInstagramDatabase(),
  now = new Date(),
): Promise<FollowupSummary> => {
  const candidates = await listInstagramFollowupCandidates(
    database,
    now.toISOString(),
    INSTAGRAM_FOLLOWUP_BATCH_SIZE,
  );
  const summary: FollowupSummary = {
    candidates: candidates.length,
    sent: 0,
    cancelled: 0,
    failed: 0,
  };

  for (const candidate of candidates) {
    const cutoffAt = getFollowupCutoffAt(candidate.lastMessageAt);
    if (now >= cutoffAt) {
      await releaseInstagramFollowupClaim(
        database,
        candidate.id,
        "Instagram follow-up window is closing",
        true,
      );
      summary.cancelled += 1;
      continue;
    }

    const claimed = await claimInstagramFollowup(
      database,
      candidate.id,
      candidate.followUpAttempts + 1,
      now.toISOString(),
    );
    if (!claimed) {
      continue;
    }

    try {
      await sendInstagramText(
        candidate.account.accessToken,
        candidate.account.instagramUserId,
        candidate.participantId,
        renderPricingFollowup(
          candidate.detectedLanguage,
          `${getInstagramPublicUrl()}/pricing`,
        ),
      );
      await markInstagramFollowupSent(database, candidate.id);
      summary.sent += 1;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const shouldStop =
        candidate.followUpAttempts + 1 >= INSTAGRAM_FOLLOWUP_MAX_ATTEMPTS ||
        now >= cutoffAt;
      await releaseInstagramFollowupClaim(
        database,
        candidate.id,
        errorMessage,
        shouldStop,
      );
      summary.failed += 1;
    }
  }

  return summary;
};
