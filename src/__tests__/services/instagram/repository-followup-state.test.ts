import {
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
    maybeSingle: jest.fn(),
    single: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  };
  Object.values(builder).forEach((method) => method.mockReturnValue(builder));
  const from = jest.fn().mockReturnValue(builder);
  return { database: { from } as never, builder };
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
    const { database, builder } = createStateDatabase();
    builder.is.mockResolvedValue({ error: null });

    await markInstagramResponseSent(
      database,
      "conversation-id",
      "2026-09-18T10:00:00.000Z",
    );

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ follow_up_due_at: "2026-09-18T10:00:00.000Z" }),
    );
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
});
