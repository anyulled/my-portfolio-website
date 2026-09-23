import {
  listActiveInstagramAccounts,
  type InstagramAccountRow,
} from "./accountRepository";
import {
  listInstagramConversationMessages,
  type InstagramConversationMessage,
} from "./metaClient";
import { getInstagramDatabase, hasInstagramMessage } from "./repository";
import {
  releaseInstagramMessageReservation,
  reserveInstagramMessage,
} from "./messageReservationRepository";
import { processInstagramWebhookMessage } from "./webhook";
import type { InstagramDatabase } from "./repository";
import type { InstagramWebhookMessage } from "./types";

const toInboundMessage = (
  account: InstagramAccountRow,
  message: InstagramConversationMessage,
): InstagramWebhookMessage => ({
  accountInstagramUserId: account.instagram_user_id,
  accountInstagramUserIdCandidates: [account.instagram_user_id],
  conversationId: message.conversationId,
  messageId: message.messageId,
  participantId: message.participantId,
  text: message.text,
  timestamp: message.timestamp,
});

export interface InstagramSyncSummary {
  accounts: number;
  messagesSeen: number;
  outboundMessagesSkipped: number;
  truncated: boolean;
  duplicatesSkipped: number;
  messagesProcessed: number;
  failures: number;
}

const getAccountMessages = async (account: InstagramAccountRow) => {
  try {
    return await listInstagramConversationMessages(
      account.access_token,
      account.instagram_user_id,
    );
  } catch {
    return null;
  }
};

export const syncInstagramConversations = async (
  database: InstagramDatabase = getInstagramDatabase(),
): Promise<InstagramSyncSummary> => {
  const accounts = await listActiveInstagramAccounts(database);
  const accountSummaries = await Promise.all(
    accounts.map(
      async (account): Promise<Omit<InstagramSyncSummary, "accounts">> => {
        const syncResult = await getAccountMessages(account);
        if (!syncResult) {
          return {
            messagesSeen: 0,
            outboundMessagesSkipped: 0,
            truncated: false,
            duplicatesSkipped: 0,
            messagesProcessed: 0,
            failures: 1,
          };
        }

        const accountSummary = {
          messagesSeen: syncResult.messages.length,
          outboundMessagesSkipped: syncResult.outboundMessagesSkipped,
          truncated: syncResult.truncated,
          duplicatesSkipped: 0,
          messagesProcessed: 0,
          failures: syncResult.truncated ? 1 : 0,
        };
        const messagesByConversation = Object.groupBy(
          syncResult.messages,
          (message) => message.conversationId,
        );
        const results = await Promise.all(
          Object.values(messagesByConversation).map(async (messages) => {
            const orderedMessages = [...(messages ?? [])].sort((left, right) =>
              left.timestamp.localeCompare(right.timestamp),
            );
            return orderedMessages.reduce(
              async (summaryPromise, message) => {
                const summary = await summaryPromise;
                try {
                  const reserved = await reserveInstagramMessage(database, {
                    messageId: message.messageId,
                    accountId: account.id,
                    conversationId: message.conversationId,
                  });
                  if (
                    !reserved ||
                    (await hasInstagramMessage(database, message.messageId))
                  ) {
                    return {
                      ...summary,
                      duplicatesSkipped: summary.duplicatesSkipped + 1,
                    };
                  }
                  await processInstagramWebhookMessage(
                    toInboundMessage(account, message),
                  );
                  return {
                    ...summary,
                    messagesProcessed: summary.messagesProcessed + 1,
                  };
                } catch {
                  await releaseInstagramMessageReservation(
                    database,
                    message.messageId,
                  ).catch(() => undefined);
                  return { ...summary, failures: summary.failures + 1 };
                }
              },
              Promise.resolve({
                messagesSeen: 0,
                outboundMessagesSkipped: 0,
                truncated: false,
                duplicatesSkipped: 0,
                messagesProcessed: 0,
                failures: 0,
              }),
            );
          }),
        );

        return results.reduce(
          (summary, result) => ({
            ...summary,
            duplicatesSkipped:
              summary.duplicatesSkipped + result.duplicatesSkipped,
            messagesProcessed:
              summary.messagesProcessed + result.messagesProcessed,
            failures: summary.failures + result.failures,
          }),
          accountSummary,
        );
      },
    ),
  );

  const initialSummary: InstagramSyncSummary = {
    accounts: accounts.length,
    messagesSeen: 0,
    outboundMessagesSkipped: 0,
    truncated: false,
    duplicatesSkipped: 0,
    messagesProcessed: 0,
    failures: 0,
  };

  return accountSummaries.reduce<InstagramSyncSummary>(
    (summary, accountSummary) => ({
      ...summary,
      messagesSeen: summary.messagesSeen + accountSummary.messagesSeen,
      outboundMessagesSkipped:
        summary.outboundMessagesSkipped +
        accountSummary.outboundMessagesSkipped,
      truncated: summary.truncated || accountSummary.truncated,
      duplicatesSkipped:
        summary.duplicatesSkipped + accountSummary.duplicatesSkipped,
      messagesProcessed:
        summary.messagesProcessed + accountSummary.messagesProcessed,
      failures: summary.failures + accountSummary.failures,
    }),
    initialSummary,
  );
};
