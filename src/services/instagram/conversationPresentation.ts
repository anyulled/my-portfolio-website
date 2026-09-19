import type { InstagramConversationRecord, InstagramHandle } from "./types";
import { resolveStoredParticipantProfile } from "./participantIdentity";

type ConversationRow = {
  id: string;
  account_handle: Array<{ handle: InstagramHandle; access_token: string }>;
  instagram_conversation_id: string;
  participant_id: string;
  participant_username: string | null;
  last_message_at: string;
  detected_language: string;
  classification: "model_form" | "pricing" | "manual_review" | "ignore";
  confidence: number;
  processing_state: "pending" | "processed" | "needs_attention" | "completed";
  response_route: "model_form" | "pricing" | "manual_review" | null;
  response_sent_at: string | null;
  last_error: string | null;
  instagram_messages: Array<{ message_text: string; sent_at: string }>;
};

const getConversationAccount = (conversation: ConversationRow) =>
  conversation.account_handle[0];

const getLastMessage = (conversation: ConversationRow) =>
  conversation.instagram_messages.at(-1)?.message_text ?? "";

const getClassification = (conversation: ConversationRow) =>
  conversation.classification === "ignore"
    ? "ignored"
    : conversation.classification;

const getParticipantProfile = async (
  conversation: ConversationRow,
  accessToken: string | undefined,
) => {
  const profile = await resolveStoredParticipantProfile(
    conversation.participant_username,
    accessToken,
    conversation.participant_id,
  );

  return {
    participantUsername: profile?.username ?? null,
    participantName: profile?.name ?? null,
    participantBiography: profile?.biography ?? null,
    participantFollowersCount: profile?.followersCount ?? null,
    participantProfilePictureUrl: profile?.profilePictureUrl ?? null,
  };
};

export const presentInstagramConversation = async (
  conversation: ConversationRow,
): Promise<InstagramConversationRecord> => {
  const account = getConversationAccount(conversation);
  const participantProfile = await getParticipantProfile(
    conversation,
    account?.access_token,
  );

  return {
    id: conversation.id,
    accountHandle: account?.handle ?? "anyulled",
    instagramConversationId: conversation.instagram_conversation_id,
    participantId: conversation.participant_id,
    ...participantProfile,
    lastMessage: getLastMessage(conversation),
    lastMessageAt: conversation.last_message_at,
    detectedLanguage: conversation.detected_language,
    classification: getClassification(conversation),
    confidence: conversation.confidence,
    processingState: conversation.processing_state,
    responseRoute: conversation.response_route,
    responseSentAt: conversation.response_sent_at,
    lastError: conversation.last_error,
  };
};
