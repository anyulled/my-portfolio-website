import { presentInstagramConversation } from "@/services/instagram/conversationPresentation";
import { resolveStoredParticipantProfile } from "@/services/instagram/participantIdentity";

jest.mock("@/services/instagram/participantIdentity", () => ({
  resolveStoredParticipantProfile: jest.fn(),
}));

const conversation = {
  id: "conversation-id",
  account_handle: [
    { handle: "anyulled" as const, access_token: "access-token" },
  ],
  instagram_conversation_id: "meta-conversation-id",
  participant_id: "participant-id",
  participant_username: "stored-name",
  last_message_at: "2026-09-19T10:00:00.000Z",
  detected_language: "en",
  classification: "ignore" as const,
  confidence: 0.8,
  processing_state: "pending" as const,
  response_route: null,
  response_sent_at: null,
  last_error: null,
  instagram_messages: [],
};

describe("presentInstagramConversation", () => {
  it("presents live profile details and marks ignored classifications", async () => {
    jest.mocked(resolveStoredParticipantProfile).mockResolvedValue({
      username: "modelname",
      name: "Model Name",
      biography: "Barcelona model",
      followersCount: 1234,
      profilePictureUrl: "https://example.com/profile.jpg",
    });

    await expect(presentInstagramConversation(conversation)).resolves.toEqual(
      expect.objectContaining({
        accountHandle: "anyulled",
        participantId: "participant-id",
        participantUsername: "modelname",
        participantName: "Model Name",
        participantBiography: "Barcelona model",
        participantFollowersCount: 1234,
        participantProfilePictureUrl: "https://example.com/profile.jpg",
        lastMessage: "",
        classification: "ignored",
      }),
    );
    expect(resolveStoredParticipantProfile).toHaveBeenCalledWith(
      "stored-name",
      "access-token",
      "participant-id",
    );
  });

  it("uses safe defaults when the account and profile are unavailable", async () => {
    jest.mocked(resolveStoredParticipantProfile).mockResolvedValue(null);

    await expect(
      presentInstagramConversation({
        ...conversation,
        account_handle: [],
        classification: "pricing",
        instagram_messages: [
          { message_text: "Need pricing", sent_at: "2026-09-19T09:00:00.000Z" },
        ],
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        accountHandle: "anyulled",
        participantUsername: null,
        participantName: null,
        participantBiography: null,
        participantFollowersCount: null,
        participantProfilePictureUrl: null,
        lastMessage: "Need pricing",
        classification: "pricing",
      }),
    );
  });
});
