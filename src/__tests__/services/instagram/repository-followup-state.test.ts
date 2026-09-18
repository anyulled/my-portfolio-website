import {
  getInstagramInitialInboundMessageTimestamp,
  markInstagramResponseSent,
  recordInstagramMessage,
} from "@/services/instagram/repository";

const account = {
  id: "account-id",
  handle: "anyulled" as const,
  instagram_user_id: "account-instagram-id",
  instagram_webhook_user_id: null,
  access_token: "access-token",
};
const classification = {
  route: "pricing" as const,
  detectedLanguage: "es",
  confidence: 0.9,
  isModel: false,
  mentionsBarcelona: false,
  mentionsPhotographyWork: false,
  isPotentialClient: true,
  reason: "pricing enquiry",
};

const createStateDatabase = () => {
  const builder = {
    select: jest.fn(),
    eq: jest.fn(),
    is: jest.fn(),
    limit: jest.fn(),
    maybeSingle: jest.fn(),
    order: jest.fn(),
    single: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  };
  Object.values(builder).forEach((method) => method.mockReturnValue(builder));
  const from = jest.fn().mockReturnValue(builder);
  const rpc = jest.fn().mockResolvedValue({ data: true, error: null });
  return { database: { from, rpc } as never, builder, rpc };
};

describe("Instagram follow-up state transitions", () => {
  it("cancels a pending follow-up without storing the new message body", async () => {
    const { database, builder } = createStateDatabase();
    builder.maybeSingle.mockResolvedValue({
      data: {
        id: "conversation-id",
        response_sent_at: "2026-09-17T12:00:00.000Z",
      },
      error: null,
    });
    builder.is.mockResolvedValue({ error: null });

    await expect(
      recordInstagramMessage(
        database,
        account,
        {
          conversationId: "external-conversation-id",
          messageId: "message-id",
          participantId: "participant-id",
          text: "private body omitted",
          timestamp: "2026-09-18T12:00:00.000Z",
        },
        classification,
      ),
    ).resolves.toEqual({
      conversation: {
        id: "conversation-id",
        response_sent_at: "2026-09-17T12:00:00.000Z",
      },
      shouldRespond: false,
    });
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ last_message_at: "2026-09-18T12:00:00.000Z" }),
    );
  });

  it("stores the follow-up schedule only after a response is sent", async () => {
    const { database, rpc } = createStateDatabase();

    await markInstagramResponseSent(
      database,
      "conversation-id",
      "2026-09-17T12:00:00.000Z",
      "2026-09-18T10:00:00.000Z",
    );

    expect(rpc).toHaveBeenCalledWith("complete_instagram_response", {
      scheduled_follow_up_at: "2026-09-18T10:00:00.000Z",
      source_message_at: "2026-09-17T12:00:00.000Z",
      target_conversation_id: "conversation-id",
    });
  });

  it("initializes follow-up state for a new conversation", async () => {
    const { database, builder } = createStateDatabase();
    const conversation = { id: "conversation-id", response_sent_at: null };
    builder.maybeSingle.mockResolvedValue({ data: null, error: null });
    builder.single.mockResolvedValue({ data: conversation, error: null });
    builder.upsert.mockReturnValue(builder);

    await expect(
      recordInstagramMessage(
        database,
        account,
        {
          conversationId: "external-conversation-id",
          messageId: "message-id",
          participantId: "participant-id",
          text: "pricing please",
          timestamp: "2026-09-18T12:00:00.000Z",
        },
        classification,
      ),
    ).resolves.toMatchObject({ conversation, shouldRespond: true });
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ follow_up_attempts: 0 }),
      expect.any(Object),
    );
  });

  it("rejects response completion when the atomic transition does not update", async () => {
    const { database, rpc } = createStateDatabase();
    rpc.mockResolvedValue({ data: false, error: null });

    await expect(
      markInstagramResponseSent(
        database,
        "conversation-id",
        "2026-09-17T12:00:00.000Z",
      ),
    ).rejects.toThrow("Instagram response completion was not persisted");
  });

  it("propagates atomic response completion errors", async () => {
    const error = new Error("completion failed");
    const { database, rpc } = createStateDatabase();
    rpc.mockResolvedValue({ data: null, error });

    await expect(
      markInstagramResponseSent(
        database,
        "conversation-id",
        "2026-09-17T12:00:00.000Z",
      ),
    ).rejects.toBe(error);
  });

  it("queries the persisted initial inbound message timestamp", async () => {
    const { database, builder } = createStateDatabase();
    builder.maybeSingle.mockResolvedValue({
      data: { sent_at: "2026-09-17T12:00:00.000Z" },
      error: null,
    });

    await expect(
      getInstagramInitialInboundMessageTimestamp(database, "conversation-id"),
    ).resolves.toBe("2026-09-17T12:00:00.000Z");
    expect(builder.order).toHaveBeenCalledWith("sent_at");
    expect(builder.limit).toHaveBeenCalledWith(1);
  });

  it("rejects a missing initial inbound message", async () => {
    const { database, builder } = createStateDatabase();
    builder.maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(
      getInstagramInitialInboundMessageTimestamp(database, "conversation-id"),
    ).rejects.toThrow("Instagram inbound message was not found");
  });

  it("propagates initial inbound message query errors", async () => {
    const error = new Error("message query failed");
    const { database, builder } = createStateDatabase();
    builder.maybeSingle.mockResolvedValue({ data: null, error });

    await expect(
      getInstagramInitialInboundMessageTimestamp(database, "conversation-id"),
    ).rejects.toBe(error);
  });
});
