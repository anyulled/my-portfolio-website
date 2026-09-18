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
import { getInstagramFollowupDueAt } from "./followups";
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

const getUniqueStrings = (...values: Array<string | null>) =>
  Array.from(
    new Set(values.filter((value): value is string => Boolean(value))),
  );

export type InstagramWebhookProcessingStage =
  | "account_lookup"
  | "classification"
  | "persistence"
  | "response_claim"
  | "response_delivery";

export class InstagramWebhookProcessingError extends Error {
  constructor(
    readonly stage: InstagramWebhookProcessingStage,
    error: unknown,
  ) {
    super(
      error instanceof Error
        ? error.message
        : "Instagram webhook processing failed",
    );
    this.name = "InstagramWebhookProcessingError";
  }
}

const runWebhookStage = async <Result>(
  stage: InstagramWebhookProcessingStage,
  action: () => Promise<Result>,
) => {
  try {
    return await action();
  } catch (error) {
    throw new InstagramWebhookProcessingError(stage, error);
  }
};

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
      const recipient = isRecord(event.recipient) ? event.recipient : {};
      const message = isRecord(event.message) ? event.message : {};
      if (message.is_echo === true) {
        return [];
      }
      const participantId = getString(sender.id);
      const recipientId = getString(recipient.id);
      const messageId = getString(message.mid);
      const text = getString(message.text);
      const timestamp = getNumber(event.timestamp);
      if (!participantId || !messageId || !text || Number.isNaN(timestamp)) {
        return [];
      }

      return [
        {
          accountInstagramUserId,
          accountInstagramUserIdCandidates: getUniqueStrings(
            accountInstagramUserId,
            recipientId,
          ),
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
  const { database, account } = await runWebhookStage(
    "account_lookup",
    async () => {
      const database = getInstagramDatabase();
      const account = await findInstagramAccount(
        database,
        message.accountInstagramUserIdCandidates,
      );
      return { database, account };
    },
  );
  const classification = await runWebhookStage("classification", () =>
    classifyInstagramMessage(message.text),
  );
  const result = await runWebhookStage("persistence", () =>
    recordInstagramMessage(database, account, message, classification),
  );

  if (!result.conversation || !result.shouldRespond) {
    return classification.route;
  }

  const responseRoute = classification.route;
  if (responseRoute === "manual_review" || responseRoute === "ignore") {
    return responseRoute;
  }

  const claimed = await runWebhookStage("response_claim", () =>
    claimInstagramResponse(database, result.conversation.id, responseRoute),
  );
  if (!claimed) {
    return "already_claimed";
  }

  return runWebhookStage("response_delivery", async () => {
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
      await markInstagramResponseSent(
        database,
        result.conversation.id,
        responseRoute === "pricing"
          ? getInstagramFollowupDueAt(message.timestamp)
          : null,
      );
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
  });
};
