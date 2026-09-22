jest.mock("@/services/instagram/accountRepository", () => ({
  listActiveInstagramAccounts: jest.fn(),
}));

jest.mock("@/services/instagram/metaClient", () => ({
  listInstagramConversationMessages: jest.fn(),
}));

jest.mock("@/services/instagram/repository", () => ({
  getInstagramDatabase: jest.fn(),
  hasInstagramMessage: jest.fn(),
}));

jest.mock("@/services/instagram/webhook", () => ({
  processInstagramWebhookMessage: jest.fn(),
}));

import { listActiveInstagramAccounts } from "@/services/instagram/accountRepository";
import { listInstagramConversationMessages } from "@/services/instagram/metaClient";
import {
  getInstagramDatabase,
  hasInstagramMessage,
} from "@/services/instagram/repository";
import { processInstagramWebhookMessage } from "@/services/instagram/webhook";
import { syncInstagramConversations } from "@/services/instagram/sync";

const database = {} as ReturnType<typeof getInstagramDatabase>;
const accounts = [
  {
    id: "anyulled-row",
    handle: "anyulled",
    instagram_user_id: "anyulled-id",
    instagram_webhook_user_id: null,
    access_token: "anyulled-token",
  },
  {
    id: "sensuelle-row",
    handle: "sensuelleboudoir",
    instagram_user_id: "sensuelle-id",
    instagram_webhook_user_id: null,
    access_token: "sensuelle-token",
  },
] as const;

const createMessage = (
  messageId: string,
  text: string,
  timestamp: string,
  conversationId = "shared-conversation",
) => ({
  conversationId,
  messageId,
  participantId: "participant-id",
  text,
  timestamp,
});

const createSyncResult = (messages: ReturnType<typeof createMessage>[]) => ({
  messages,
  truncated: false,
  outboundMessagesSkipped: 0,
});

const emptySyncResult = () => createSyncResult([]);

describe("syncInstagramConversations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getInstagramDatabase).mockReturnValue(database);
    jest
      .mocked(listActiveInstagramAccounts)
      .mockResolvedValue(accounts as never);
    jest.mocked(hasInstagramMessage).mockResolvedValue(false);
    jest
      .mocked(processInstagramWebhookMessage)
      .mockResolvedValue("model_form" as never);
    jest
      .mocked(listInstagramConversationMessages)
      .mockImplementation(async (_token, accountId) => ({
        messages: [
          {
            conversationId: `${accountId}-conversation`,
            messageId: `${accountId}-message`,
            participantId: `${accountId}-participant`,
            text: "Sono una modella",
            timestamp: "2026-09-22T15:50:00.000Z",
          },
        ],
        truncated: false,
        outboundMessagesSkipped: 0,
      }));
  });

  it("syncs both accounts and routes inbound messages through the existing processor", async () => {
    await expect(syncInstagramConversations()).resolves.toEqual({
      accounts: 2,
      messagesSeen: 2,
      outboundMessagesSkipped: 0,
      duplicatesSkipped: 0,
      messagesProcessed: 2,
      failures: 0,
    });

    expect(listInstagramConversationMessages).toHaveBeenNthCalledWith(
      1,
      "anyulled-token",
      "anyulled-id",
    );
    expect(listInstagramConversationMessages).toHaveBeenNthCalledWith(
      2,
      "sensuelle-token",
      "sensuelle-id",
    );
    expect(processInstagramWebhookMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        accountInstagramUserId: "anyulled-id",
        messageId: "anyulled-id-message",
      }),
    );
  });

  it("skips messages already recorded by an earlier sync", async () => {
    jest.mocked(hasInstagramMessage).mockResolvedValue(true);

    await expect(syncInstagramConversations(database)).resolves.toMatchObject({
      messagesSeen: 2,
      duplicatesSkipped: 2,
      messagesProcessed: 0,
    });
    expect(processInstagramWebhookMessage).not.toHaveBeenCalled();
  });

  it("counts processing failures without persisting message bodies in the summary", async () => {
    jest
      .mocked(processInstagramWebhookMessage)
      .mockRejectedValueOnce(new Error("processing failed"));

    await expect(syncInstagramConversations(database)).resolves.toMatchObject({
      messagesSeen: 2,
      messagesProcessed: 1,
      failures: 1,
    });
  });

  it("continues with the other account when one account lookup fails", async () => {
    jest
      .mocked(listInstagramConversationMessages)
      .mockRejectedValueOnce(new Error("Meta unavailable"));

    await expect(syncInstagramConversations(database)).resolves.toMatchObject({
      accounts: 2,
      messagesSeen: 1,
      messagesProcessed: 1,
      failures: 1,
    });
  });

  it("processes messages in timestamp order within one conversation", async () => {
    jest
      .mocked(listInstagramConversationMessages)
      .mockResolvedValueOnce({
        ...createSyncResult([
          createMessage("newer-message", "newer", "2026-09-22T16:00:00.000Z"),
          createMessage("older-message", "older", "2026-09-22T15:00:00.000Z"),
        ]),
      })
      .mockResolvedValueOnce(emptySyncResult());

    await syncInstagramConversations(database);

    expect(processInstagramWebhookMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ messageId: "older-message" }),
    );
    expect(processInstagramWebhookMessage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ messageId: "newer-message" }),
    );
  });

  it("counts message lookup failures and continues the conversation", async () => {
    jest
      .mocked(listInstagramConversationMessages)
      .mockResolvedValueOnce({
        ...createSyncResult([
          createMessage(
            "failed-lookup-message",
            "first",
            "2026-09-22T15:00:00.000Z",
          ),
          createMessage(
            "successful-message",
            "second",
            "2026-09-22T16:00:00.000Z",
          ),
        ]),
      })
      .mockResolvedValueOnce(emptySyncResult());
    jest
      .mocked(hasInstagramMessage)
      .mockRejectedValueOnce(new Error("lookup failed"))
      .mockResolvedValue(false);

    await expect(syncInstagramConversations(database)).resolves.toMatchObject({
      messagesSeen: 2,
      messagesProcessed: 1,
      failures: 1,
    });
  });
});
