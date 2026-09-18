import {
  claimInstagramFollowup,
  listInstagramFollowupCandidates,
  markInstagramFollowupSent,
  releaseInstagramFollowupClaim,
  updateInstagramFollowupForNewInboundMessage,
} from "@/services/instagram/followupRepository";

const createDatabase = (result: { data?: unknown; error: unknown }) => {
  const builder = {
    select: jest.fn(),
    eq: jest.fn(),
    not: jest.fn(),
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
          instagram_accounts: [],
        },
      ],
      error: null,
    };
    const { database } = createDatabase(result);

    await expect(
      listInstagramFollowupCandidates(database, "2026-09-18T12:00:00.000Z", 20),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "conversation-id",
        account: expect.objectContaining({ handle: "anyulled" }),
      }),
    ]);
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

  it("claims, marks sent, and releases a follow-up", async () => {
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
      ),
    ).resolves.toBe(true);
    await markInstagramFollowupSent(database, "conversation-id");
    await releaseInstagramFollowupClaim(
      database,
      "conversation-id",
      "temporary",
      false,
    );

    expect(builder.update).toHaveBeenCalledTimes(3);
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
      ),
    ).rejects.toBe(error);
    const updateErrorDatabase = createDatabase({ error: null });
    updateErrorDatabase.builder.eq.mockResolvedValue({ error });
    await expect(
      markInstagramFollowupSent(
        updateErrorDatabase.database,
        "conversation-id",
      ),
    ).rejects.toBe(error);
    await expect(
      releaseInstagramFollowupClaim(
        updateErrorDatabase.database,
        "conversation-id",
        "error",
        true,
      ),
    ).rejects.toBe(error);
  });
});
