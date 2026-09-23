import { getInstagramDatabase } from "./repository";

export const reserveInstagramMessage = async (
  database: ReturnType<typeof getInstagramDatabase>,
  reservation: {
    messageId: string;
    accountId: string;
    conversationId: string;
  },
) => {
  const result = await database.from("instagram_message_reservations").insert({
    instagram_message_id: reservation.messageId,
    account_id: reservation.accountId,
    instagram_conversation_id: reservation.conversationId,
  });

  if (result.error?.code === "23505") {
    return false;
  }
  if (result.error) {
    throw result.error;
  }

  return true;
};

export const releaseInstagramMessageReservation = async (
  database: ReturnType<typeof getInstagramDatabase>,
  messageId: string,
) => {
  const result = await database
    .from("instagram_message_reservations")
    .delete()
    .eq("instagram_message_id", messageId);

  if (result.error) {
    throw result.error;
  }
};
