import { parseInstagramWebhookPayload } from "@/services/instagram/webhook";

describe("parseInstagramWebhookPayload", () => {
  it("extracts text messages from Meta webhook entries", () => {
    const messages = parseInstagramWebhookPayload({
      entry: [
        {
          id: "account-id",
          messaging: [
            {
              sender: { id: "participant-id" },
              timestamp: 1770000000000,
              message: { mid: "message-id", text: "Sono una modella" },
            },
          ],
        },
      ],
    });

    expect(messages).toEqual([
      {
        accountInstagramUserId: "account-id",
        conversationId: "participant-id",
        messageId: "message-id",
        participantId: "participant-id",
        text: "Sono una modella",
        timestamp: "2026-02-02T02:40:00.000Z",
      },
    ]);
  });

  it("ignores malformed events", () => {
    expect(
      parseInstagramWebhookPayload({ entry: [{ id: "account-id" }] }),
    ).toEqual([]);
  });
});
