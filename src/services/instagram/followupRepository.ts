import type { InstagramDatabase } from "./repository";
import type { InstagramFollowupCandidate, InstagramHandle } from "./types";

type DeliveryAccount = {
  handle: InstagramHandle;
  instagram_user_id: string;
  access_token: string;
};

type DeliveryAccountRelation = DeliveryAccount | DeliveryAccount[] | null;

const normalizeAccount = (relation: DeliveryAccountRelation) =>
  Array.isArray(relation) ? (relation.at(0) ?? null) : relation;

export const updateInstagramFollowupForNewInboundMessage = async (
  database: InstagramDatabase,
  conversationId: string,
  messageTimestamp: string,
) => {
  const { error } = await database
    .from("instagram_conversations")
    .update({
      last_message_at: messageTimestamp,
      follow_up_cancelled_at: new Date().toISOString(),
      follow_up_claimed_at: null,
    })
    .eq("id", conversationId)
    .is("follow_up_sent_at", null);

  if (error) {
    throw error;
  }
};

export const listInstagramFollowupCandidates = async (
  database: InstagramDatabase,
  now: string,
  batchSize: number,
): Promise<Array<InstagramFollowupCandidate>> => {
  const result = await database
    .from("instagram_conversations")
    .select(
      "id, participant_id, last_message_at, detected_language, follow_up_due_at, follow_up_attempts, instagram_accounts(handle, instagram_user_id, access_token)",
    )
    .eq("response_route", "pricing")
    .not("response_sent_at", "is", null)
    .not("follow_up_due_at", "is", null)
    .is("follow_up_sent_at", null)
    .is("follow_up_cancelled_at", null)
    .is("follow_up_claimed_at", null)
    .lt("follow_up_attempts", 3)
    .lte("follow_up_due_at", now)
    .order("follow_up_due_at")
    .limit(batchSize);
  const data = result.data as unknown as Array<{
    id: string;
    participant_id: string;
    last_message_at: string;
    detected_language: string;
    follow_up_due_at: string;
    follow_up_attempts: number;
    instagram_accounts: DeliveryAccountRelation;
  }> | null;

  if (result.error) {
    throw result.error;
  }

  return (data ?? []).flatMap((row) => {
    const account = normalizeAccount(row.instagram_accounts);
    return account
      ? [
          {
            id: row.id,
            participantId: row.participant_id,
            detectedLanguage: row.detected_language,
            lastMessageAt: row.last_message_at,
            followUpDueAt: row.follow_up_due_at,
            followUpAttempts: row.follow_up_attempts,
            account: {
              handle: account.handle,
              instagramUserId: account.instagram_user_id,
              accessToken: account.access_token,
            },
          },
        ]
      : [];
  });
};

export const claimInstagramFollowup = async (
  database: InstagramDatabase,
  conversationId: string,
  attempt: number,
  claimedAt: string,
) => {
  const result = await database
    .from("instagram_conversations")
    .update({
      follow_up_claimed_at: claimedAt,
      follow_up_attempts: attempt,
      follow_up_last_error: null,
    })
    .eq("id", conversationId)
    .is("follow_up_claimed_at", null)
    .is("follow_up_sent_at", null)
    .is("follow_up_cancelled_at", null)
    .lt("follow_up_attempts", 3)
    .select("id")
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return Boolean(result.data);
};

export const markInstagramFollowupSent = async (
  database: InstagramDatabase,
  conversationId: string,
) => {
  const { error } = await database
    .from("instagram_conversations")
    .update({
      follow_up_sent_at: new Date().toISOString(),
      follow_up_claimed_at: null,
      follow_up_last_error: null,
    })
    .eq("id", conversationId);

  if (error) {
    throw error;
  }
};

export const releaseInstagramFollowupClaim = async (
  database: InstagramDatabase,
  conversationId: string,
  errorMessage: string,
  needsAttention: boolean,
) => {
  const { error } = await database
    .from("instagram_conversations")
    .update({
      follow_up_claimed_at: null,
      follow_up_last_error: errorMessage,
      processing_state: needsAttention ? "needs_attention" : "completed",
    })
    .eq("id", conversationId);

  if (error) {
    throw error;
  }
};
