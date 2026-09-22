import {
  releaseInstagramMessageReservation,
  reserveInstagramMessage,
} from "@/services/instagram/messageReservationRepository";

const createDatabase = (result: { error: { code?: string } | null }) => {
  const eq = jest.fn().mockResolvedValue(result);
  const remove = jest.fn().mockReturnValue({ eq });
  const insert = jest.fn().mockResolvedValue(result);
  const from = jest.fn().mockReturnValue({ insert, delete: remove });

  return { database: { from } as never, from, insert, remove, eq };
};

describe("Instagram message reservations", () => {
  it("reserves a new message", async () => {
    const { database, from, insert } = createDatabase({ error: null });

    await expect(
      reserveInstagramMessage(database, {
        messageId: "message-id",
        accountId: "account-id",
        conversationId: "conversation-id",
      }),
    ).resolves.toBe(true);

    expect(from).toHaveBeenCalledWith("instagram_message_reservations");
    expect(insert).toHaveBeenCalledWith({
      instagram_message_id: "message-id",
      account_id: "account-id",
      instagram_conversation_id: "conversation-id",
    });
  });

  it("reports an existing reservation without throwing", async () => {
    const { database } = createDatabase({ error: { code: "23505" } });

    await expect(
      reserveInstagramMessage(database, {
        messageId: "message-id",
        accountId: "account-id",
        conversationId: "conversation-id",
      }),
    ).resolves.toBe(false);
  });

  it("releases a failed reservation", async () => {
    const { database, remove, eq } = createDatabase({ error: null });

    await expect(
      releaseInstagramMessageReservation(database, "message-id"),
    ).resolves.toBeUndefined();

    expect(remove).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("instagram_message_id", "message-id");
  });
});
