import { createClient } from "@supabase/supabase-js";
import type {
  ClassificationRoute,
  InstagramConversationRecord,
  InstagramHandle,
  NormalizedClassification,
  ProcessingState,
  ResponseRoute,
} from "./types";

interface InstagramAccountRow {
  id: string;
  handle: InstagramHandle;
  instagram_user_id: string;
  access_token: string;
}

interface InstagramConversationRow {
  id: string;
  instagram_accounts: { handle: InstagramHandle } | null;
  instagram_conversation_id: string;
  participant_id: string;
  participant_username: string | null;
  last_message_at: string;
  detected_language: string;
  classification: ClassificationRoute;
  confidence: number;
  processing_state: ProcessingState;
  response_route: ResponseRoute | null;
  response_claimed_at: string | null;
  response_sent_at: string | null;
  last_error: string | null;
}

interface InstagramConversationListRow {
  id: string;
  account_handle: Array<{ handle: InstagramHandle }>;
  instagram_conversation_id: string;
  participant_id: string;
  participant_username: string | null;
  last_message_at: string;
  detected_language: string;
  classification: ClassificationRoute;
  confidence: number;
  processing_state: ProcessingState;
  response_route: ResponseRoute | null;
  response_sent_at: string | null;
  last_error: string | null;
  instagram_messages: Array<{ message_text: string; sent_at: string }>;
}

const getRequiredEnvironmentValue = (
  name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY",
) => {
  const value =
    name === "SUPABASE_URL"
      ? process.env.SUPABASE_URL
      : process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

export const getInstagramDatabase = () =>
  createClient(
    getRequiredEnvironmentValue("SUPABASE_URL"),
    getRequiredEnvironmentValue("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

export const findInstagramAccount = async (
  database: ReturnType<typeof getInstagramDatabase>,
  instagramUserId: string,
): Promise<InstagramAccountRow> => {
  const result = await database
    .from("instagram_accounts")
    .select("id, handle, instagram_user_id, access_token")
    .eq("instagram_user_id", instagramUserId)
    .eq("active", true)
    .single();
  const data = result.data as unknown as InstagramAccountRow | null;
  const { error } = result;

  if (error || !data) {
    throw new Error("Instagram account is not configured");
  }

  return data;
};

export const upsertInstagramAccount = async (
  database: ReturnType<typeof getInstagramDatabase>,
  account: Pick<
    InstagramAccountRow,
    "handle" | "instagram_user_id" | "access_token"
  > & { token_expires_at: string | null },
) => {
  const { error } = await database.from("instagram_accounts").upsert(
    {
      handle: account.handle,
      instagram_user_id: account.instagram_user_id,
      access_token: account.access_token,
      token_expires_at: account.token_expires_at,
      active: true,
    },
    { onConflict: "handle" },
  );
  if (error) {
    throw error;
  }
};

export const findInstagramConversation = async (
  database: ReturnType<typeof getInstagramDatabase>,
  accountId: string,
  conversationId: string,
) => {
  const result = await database
    .from("instagram_conversations")
    .select("*")
    .eq("account_id", accountId)
    .eq("instagram_conversation_id", conversationId)
    .maybeSingle();
  const data = result.data as unknown as InstagramConversationRow | null;
  const { error } = result;

  if (error) {
    throw error;
  }

  return data;
};

export const recordInstagramMessage = async (
  database: ReturnType<typeof getInstagramDatabase>,
  account: InstagramAccountRow,
  message: {
    conversationId: string;
    messageId: string;
    participantId: string;
    participantUsername?: string;
    text: string;
    timestamp: string;
  },
  classification: NormalizedClassification,
) => {
  const existingConversation = await findInstagramConversation(
    database,
    account.id,
    message.conversationId,
  );

  if (existingConversation?.response_sent_at) {
    return { conversation: existingConversation, shouldRespond: false };
  }

  if (classification.route === "ignore") {
    return { conversation: null, shouldRespond: false };
  }

  const state =
    classification.route === "manual_review" ? "pending" : "processed";
  const result = await database
    .from("instagram_conversations")
    .upsert(
      {
        account_id: account.id,
        instagram_conversation_id: message.conversationId,
        participant_id: message.participantId,
        participant_username: message.participantUsername ?? null,
        last_message_at: message.timestamp,
        detected_language: classification.detectedLanguage,
        classification: classification.route,
        confidence: classification.confidence,
        processing_state: state,
        response_route:
          classification.route === "manual_review"
            ? null
            : classification.route,
        last_error: null,
      },
      { onConflict: "account_id,instagram_conversation_id" },
    )
    .select("*")
    .single();
  const data = result.data as unknown as InstagramConversationRow | null;
  const { error } = result;

  if (error || !data) {
    throw error ?? new Error("Instagram conversation was not persisted");
  }

  const { error: messageError } = await database
    .from("instagram_messages")
    .upsert(
      {
        conversation_id: data.id,
        instagram_message_id: message.messageId,
        message_text: message.text,
        sent_at: message.timestamp,
      },
      { onConflict: "instagram_message_id", ignoreDuplicates: true },
    );

  if (messageError && messageError.code !== "23505") {
    throw messageError;
  }

  return {
    conversation: data,
    shouldRespond: classification.route !== "manual_review",
  };
};

export const listInstagramConversations = async (
  database: ReturnType<typeof getInstagramDatabase>,
): Promise<Array<InstagramConversationRecord>> => {
  const result = await database
    .from("instagram_conversations")
    .select(
      "id, account_handle:instagram_accounts(handle), instagram_conversation_id, participant_id, participant_username, last_message_at, detected_language, classification, confidence, processing_state, response_route, response_sent_at, last_error, instagram_messages(message_text, sent_at)",
    )
    .in("processing_state", ["pending", "needs_attention"])
    .order("updated_at", { ascending: false });
  const data =
    result.data as unknown as Array<InstagramConversationListRow> | null;
  const { error } = result;

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const conversation = row as unknown as InstagramConversationListRow;
    const lastMessage = conversation.instagram_messages.at(-1);
    return {
      id: conversation.id,
      accountHandle: conversation.account_handle[0]?.handle ?? "anyulled",
      instagramConversationId: conversation.instagram_conversation_id,
      participantId: conversation.participant_id,
      participantUsername: conversation.participant_username,
      lastMessage: lastMessage?.message_text ?? "",
      lastMessageAt: conversation.last_message_at,
      detectedLanguage: conversation.detected_language,
      classification:
        conversation.classification === "ignore"
          ? "ignored"
          : conversation.classification,
      confidence: conversation.confidence,
      processingState: conversation.processing_state,
      responseRoute: conversation.response_route,
      responseSentAt: conversation.response_sent_at,
      lastError: conversation.last_error,
    };
  });
};

export const markInstagramConversationError = async (
  database: ReturnType<typeof getInstagramDatabase>,
  conversationId: string,
  message: string,
) => {
  const { error } = await database
    .from("instagram_conversations")
    .update({ processing_state: "needs_attention", last_error: message })
    .eq("id", conversationId);

  if (error) {
    throw error;
  }
};

export const claimInstagramResponse = async (
  database: ReturnType<typeof getInstagramDatabase>,
  conversationId: string,
  responseRoute: ResponseRoute,
) => {
  const { data, error } = await database
    .from("instagram_conversations")
    .update({
      response_route: responseRoute,
      response_claimed_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("id", conversationId)
    .is("response_sent_at", null)
    .is("response_claimed_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
};

export const markInstagramResponseSent = async (
  database: ReturnType<typeof getInstagramDatabase>,
  conversationId: string,
) => {
  const { error } = await database
    .from("instagram_conversations")
    .update({
      processing_state: "completed",
      response_sent_at: new Date().toISOString(),
      response_claimed_at: null,
      last_error: null,
    })
    .eq("id", conversationId)
    .is("response_sent_at", null);

  if (error) {
    throw error;
  }
};

export const releaseInstagramResponseClaim = async (
  database: ReturnType<typeof getInstagramDatabase>,
  conversationId: string,
  errorMessage: string,
) => {
  const { error } = await database
    .from("instagram_conversations")
    .update({
      processing_state: "needs_attention",
      response_claimed_at: null,
      last_error: errorMessage,
    })
    .eq("id", conversationId);

  if (error) {
    throw error;
  }
};

export const assignLeadCorrelationToken = async (
  database: ReturnType<typeof getInstagramDatabase>,
  conversationId: string,
) => {
  const token = crypto.randomUUID();
  const { error } = await database
    .from("instagram_conversations")
    .update({ response_correlation_token: token })
    .eq("id", conversationId);

  if (error) {
    throw error;
  }

  return token;
};

export const setInstagramReviewDecision = async (
  database: ReturnType<typeof getInstagramDatabase>,
  conversationId: string,
  decision: "model_form" | "pricing" | "ignore",
) => {
  const result = await database
    .from("instagram_conversations")
    .update({
      classification: decision === "ignore" ? "ignored" : decision,
      processing_state: decision === "ignore" ? "completed" : "processed",
      response_route: decision === "ignore" ? null : decision,
      last_error: null,
    })
    .eq("id", conversationId)
    .eq("processing_state", "pending")
    .select("*")
    .single();
  const data = result.data as unknown as InstagramConversationRow | null;
  const { error } = result;

  if (error || !data) {
    throw error ?? new Error("Conversation is no longer awaiting review");
  }

  return data;
};

export const getInstagramConversationForDelivery = async (
  database: ReturnType<typeof getInstagramDatabase>,
  conversationId: string,
) => {
  const result = await database
    .from("instagram_conversations")
    .select(
      "id, participant_id, detected_language, response_route, response_sent_at, instagram_accounts(handle, instagram_user_id, access_token)",
    )
    .eq("id", conversationId)
    .single();
  const data = result.data as unknown as {
    id: string;
    participant_id: string;
    detected_language: string;
    response_route: ResponseRoute | null;
    response_sent_at: string | null;
    instagram_accounts: Array<InstagramAccountRow>;
  } | null;
  const { error } = result;

  if (error || !data) {
    throw error ?? new Error("Instagram conversation was not found");
  }

  return data;
};
