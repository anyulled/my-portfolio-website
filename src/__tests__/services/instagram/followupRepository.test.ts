import {
  beginInstagramFollowupDelivery,
  cancelInstagramFollowup,
  claimInstagramFollowup,
  listInstagramFollowupCandidates,
  markInstagramFollowupForReconciliation,
  markInstagramFollowupSent,
  releaseInstagramFollowupClaim,
  updateInstagramFollowupForNewInboundMessage,
} from "@/services/instagram/followupRepository";

const createDatabase = (result: { data?: unknown; error: unknown }) => {
  const builder = {
    select: jest.fn(),
    eq: jest.fn(),
    not: jest.fn(),
    or: jest.fn(),
    is: jest.fn(),
    lt: jest.fn(),
    lte: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    update: jest.fn(),
    maybeSingle: jest.fn(),
  };
  Object.values(builder).forEach((method) => method.mockReturnValue(builder));
  builder.maybeSingle = jest.fn().mockResolvedValue(result);
  builder.limit = jest.fn().mockResolvedValue(result);
  const from = jest.fn().mockReturnValue(builder);
  return { database: { from } as never, builder, from };
};

describe("Instagram follow-up repository", () => {
  it("cancels an unsent follow-up when a customer replies", async () => {
    const { database, builder } = createDatabase({ error: null });

    await updateInstagramFollowupForNewInboundMessage(
      database,
      "conversation-id",
      "2026-09-18T12:00:00.000Z",
    );

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        last_message_at: "2026-09-18T12:00:00.000Z",
        follow_up_claimed_at: null,
      }),
    );
  });

  it("lists only rows with a connected account", async () => {
    const result = {
      data: [
        {
          id: "conversation-id",
          participant_id: "participant-id",
          last_message_at: "2026-09-17T13:00:00.000Z",
          detected_language: "es",
          follow_up_due_at: "2026-09-18T11:00:00.000Z",
          follow_up_attempts: 1,
          follow_up_delivery_started_at: null,
          instagram_accounts: [
            {
              handle: "anyulled",
              instagram_user_id: "account-id",
              access_token: "secret",
            },
          ],
        },
        {
          id: "without-account",
          participant_id: "participant-id",
          last_message_at: "2026-09-17T13:00:00.000Z",
          detected_language: "es",
          follow_up_due_at: "2026-09-18T11:00:00.000Z",
          follow_up_attempts: 1,
          follow_up_delivery_started_at: null,
          instagram_accounts: [],
        },
      ],
      error: null,
    };
    const { database, builder } = createDatabase(result);

    await expect(
      listInstagramFollowupCandidates(database, "2026-09-18T12:00:00.000Z", 20),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "conversation-id",
        account: expect.objectContaining({ handle: "anyulled" }),
      }),
    ]);
    expect(builder.or).toHaveBeenCalledWith(
      "follow_up_claimed_at.is.null,follow_up_claimed_at.lt.2026-09-18T11:50:00.000Z",
    );
  });

  it("normalizes an object account relation", async () => {
    const { database } = createDatabase({
      data: [
        {
          id: "conversation-id",
          participant_id: "participant-id",
          last_message_at: "2026-09-17T13:00:00.000Z",
          detected_language: "es",
          follow_up_due_at: "2026-09-18T11:00:00.000Z",
          follow_up_attempts: 1,
          follow_up_delivery_started_at: null,
          instagram_accounts: {
            handle: "sensuelleboudoir",
            instagram_user_id: "account-id",
            access_token: "secret",
          },
        },
      ],
      error: null,
    });

    await expect(
      listInstagramFollowupCandidates(database, "2026-09-18T12:00:00.000Z", 20),
    ).resolves.toEqual([
      expect.objectContaining({
        account: expect.objectContaining({ handle: "sensuelleboudoir" }),
      }),
    ]);
  });

  it("returns no candidates when the query has no rows", async () => {
    const { database } = createDatabase({ data: null, error: null });

    await expect(
      listInstagramFollowupCandidates(database, "2026-09-18T12:00:00.000Z", 20),
    ).resolves.toEqual([]);
  });

  it("claims, starts delivery, marks sent, and releases with ownership fencing", async () => {
    const { database, builder } = createDatabase({
      data: { id: "conversation-id" },
      error: null,
    });

    await expect(
      claimInstagramFollowup(
        database,
        "conversation-id",
        2,
        "2026-09-18T12:00:00.000Z",
        "claim-token",
      ),
    ).resolves.toBe(true);
    await expect(
      beginInstagramFollowupDelivery(
        database,
        "conversation-id",
        "claim-token",
        "2026-09-18T12:00:00.000Z",
      ),
    ).resolves.toBe(true);
    await expect(
      markInstagramFollowupSent(
        database,
        "conversation-id",
        "claim-token",
        "provider-message-id",
      ),
    ).resolves.toBe(true);
    await releaseInstagramFollowupClaim(
      database,
      "conversation-id",
      "claim-token",
      "temporary",
      false,
    );

    expect(builder.update).toHaveBeenCalledTimes(4);
    expect(builder.eq).toHaveBeenCalledWith(
      "follow_up_claim_token",
      "claim-token",
    );
  });

  it("persists delivered follow-ups as non-retryable reconciliation work", async () => {
    const { database, builder } = createDatabase({ error: null });

    await markInstagramFollowupForReconciliation(
      database,
      "conversation-id",
      "claim-token",
      "provider-message-id",
      "finalization failed",
    );

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        follow_up_cancelled_at: expect.any(String),
        follow_up_provider_message_id: "provider-message-id",
        processing_state: "needs_attention",
      }),
    );
  });

  it("records terminal cancellation timestamps", async () => {
    const { database, builder } = createDatabase({ error: null });

    await cancelInstagramFollowup(
      database,
      "conversation-id",
      "window closing",
    );

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        follow_up_cancelled_at: expect.any(String),
        follow_up_claim_token: null,
      }),
    );
  });

  it("propagates database errors", async () => {
    const error = new Error("database unavailable");
    const { database } = createDatabase({ error });

    await expect(
      listInstagramFollowupCandidates(database, "2026-09-18T12:00:00.000Z", 20),
    ).rejects.toBe(error);
    await expect(
      claimInstagramFollowup(
        database,
        "conversation-id",
        1,
        "2026-09-18T12:00:00.000Z",
        "claim-token",
      ),
    ).rejects.toBe(error);
    await expect(
      markInstagramFollowupSent(
        database,
        "conversation-id",
        "claim-token",
        "provider-message-id",
      ),
    ).rejects.toBe(error);
    const updateErrorDatabase = createDatabase({ error: null });
    updateErrorDatabase.builder.is.mockResolvedValue({ error });
    await expect(
      releaseInstagramFollowupClaim(
        updateErrorDatabase.database,
        "conversation-id",
        "claim-token",
        "error",
        true,
      ),
    ).rejects.toBe(error);
  });
});
