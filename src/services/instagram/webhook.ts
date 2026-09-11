import {
  assignLeadCorrelationToken,
  claimInstagramResponse,
  findInstagramAccount,
  getInstagramDatabase,
  markInstagramResponseSent,
  recordInstagramMessage,
  releaseInstagramResponseClaim,
} from "./repository";
import { classifyInstagramMessage } from "./classifier";
import { getInstagramPublicUrl } from "./config";
import { sendInstagramText } from "./metaClient";
import { renderBoundedResponse } from "./responseTemplates";
import type { InstagramWebhookMessage } from "./types";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const getString = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : null;

const getNumber = (value: unknown) =>
  typeof value === "number" ? value : Number(value);

const getRecords = (value: unknown) =>
  Array.isArray(value) ? value.filter(isRecord) : [];

export const parseInstagramWebhookPayload = (
  payload: unknown,
): Array<InstagramWebhookMessage> => {
  if (!isRecord(payload)) {
    return [];
  }

  return getRecords(payload.entry).flatMap((entry) => {
    const accountInstagramUserId = getString(entry.id);
    if (!accountInstagramUserId) {
      return [];
    }

    return getRecords(entry.messaging).flatMap((event) => {
      const sender = isRecord(event.sender) ? event.sender : {};
      const message = isRecord(event.message) ? event.message : {};
      const participantId = getString(sender.id);
      const messageId = getString(message.mid);
      const text = getString(message.text);
      const timestamp = getNumber(event.timestamp);
      if (!participantId || !messageId || !text || Number.isNaN(timestamp)) {
        return [];
      }

      return [
        {
          accountInstagramUserId,
          conversationId: getString(event.thread_id) ?? participantId,
          messageId,
          participantId,
          text,
          timestamp: new Date(timestamp).toISOString(),
        },
      ];
    });
  });
};

export const processInstagramWebhookMessage = async (
  message: InstagramWebhookMessage,
) => {
  const database = getInstagramDatabase();
  const account = await findInstagramAccount(
    database,
    message.accountInstagramUserId,
  );
  const classification = await classifyInstagramMessage(message.text);
  const result = await recordInstagramMessage(
    database,
    account,
    message,
    classification,
  );

  if (!result.conversation || !result.shouldRespond) {
    return classification.route;
  }

  const responseRoute = classification.route;
  if (responseRoute === "manual_review" || responseRoute === "ignore") {
    return responseRoute;
  }

  const claimed = await claimInstagramResponse(
    database,
    result.conversation.id,
    responseRoute,
  );
  if (!claimed) {
    return "already_claimed";
  }

  try {
    const leadToken =
      responseRoute === "model_form"
        ? await assignLeadCorrelationToken(database, result.conversation.id)
        : null;
    const path =
      responseRoute === "model_form"
        ? `/booking-a-session?lead=${leadToken}`
        : "/pricing";
    const responseText = renderBoundedResponse(
      responseRoute,
      classification.detectedLanguage,
      `${getInstagramPublicUrl()}${path}`,
    );
    await sendInstagramText(
      account.access_token,
      account.instagram_user_id,
      message.participantId,
      responseText,
    );
    await markInstagramResponseSent(database, result.conversation.id);
    return responseRoute;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Instagram processing failed";
    await releaseInstagramResponseClaim(
      database,
      result.conversation.id,
      errorMessage,
    );
    throw error;
  }
};
