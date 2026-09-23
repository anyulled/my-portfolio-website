import {
  listInstagramConversationMessages,
  resolveInstagramProfile,
  resolveInstagramUsername,
  sendInstagramText,
} from "@/services/instagram/metaClient";

describe("sendInstagramText", () => {
  const originalVersion = process.env.INSTAGRAM_GRAPH_API_VERSION;

  beforeEach(() => {
    process.env.INSTAGRAM_GRAPH_API_VERSION = "26.0";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message_id: "message-id" }),
    });
  });

  afterEach(() => {
    if (originalVersion === undefined) {
      delete process.env.INSTAGRAM_GRAPH_API_VERSION;
    } else {
      process.env.INSTAGRAM_GRAPH_API_VERSION = originalVersion;
    }
    jest.restoreAllMocks();
  });

  it("uses a version-prefixed Graph API URL", async () => {
    await sendInstagramText(
      "access-token",
      "account-id",
      "recipient-id",
      "Hello",
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "https://graph.instagram.com/v26.0/account-id/messages",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("resolves the webhook identity through the Instagram profile endpoint", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ username: "anyulled" }),
    });

    await expect(
      resolveInstagramUsername("access-token", "webhook-account-id"),
    ).resolves.toBe("anyulled");

    expect(global.fetch).toHaveBeenCalledWith(
      new URL(
        "https://graph.instagram.com/v26.0/webhook-account-id?fields=username",
      ),
      { headers: { Authorization: "Bearer access-token" } },
    );
  });

  it("ignores identities rejected by Meta", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });

    await expect(
      resolveInstagramUsername("access-token", "unknown-account-id"),
    ).resolves.toBeNull();
  });

  it("resolves the profile details used by the inbox", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        username: "modelname",
        name: "Model Name",
        biography: "Barcelona model",
        followers_count: 1234,
        profile_picture_url: "https://example.com/profile.jpg",
      }),
    });

    await expect(
      resolveInstagramProfile("access-token", "participant-id"),
    ).resolves.toEqual({
      username: "modelname",
      name: "Model Name",
      biography: "Barcelona model",
      followersCount: 1234,
      profilePictureUrl: "https://example.com/profile.jpg",
    });
    expect(global.fetch).toHaveBeenCalledWith(
      new URL(
        "https://graph.instagram.com/v26.0/participant-id?fields=username%2Cname%2Cbiography%2Cfollowers_count%2Cprofile_picture_url",
      ),
      { headers: { Authorization: "Bearer access-token" } },
    );
  });

  it("normalizes unavailable profile fields and rejected responses", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          username: "",
          name: 42,
          biography: null,
          followers_count: "1234",
          profile_picture_url: false,
        }),
      })
      .mockResolvedValueOnce({ ok: false });

    await expect(
      resolveInstagramProfile("access-token", "participant-id"),
    ).resolves.toEqual({
      username: null,
      name: null,
      biography: null,
      followersCount: null,
      profilePictureUrl: null,
    });
    await expect(
      resolveInstagramProfile("access-token", "participant-id"),
    ).resolves.toBeNull();
  });

  it("returns no username for malformed profile responses", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => null })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: "" }),
      });

    await expect(
      resolveInstagramUsername("access-token", "unknown-account-id"),
    ).resolves.toBeNull();
    await expect(
      resolveInstagramUsername("access-token", "unknown-account-id"),
    ).resolves.toBeNull();
  });

  it("lists inbound messages from paginated Instagram conversations", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "conversation-id",
              messages: {
                data: [
                  {
                    id: "inbound-message-id",
                    from: { id: "participant-id" },
                    message: "Sono una modella",
                    created_time: "2026-09-22T15:50:00+0000",
                  },
                  {
                    id: "outbound-message-id",
                    from: { id: "account-id" },
                    message: "Risposta automatica",
                    created_time: "2026-09-22T15:51:00+0000",
                  },
                  {
                    id: "echo-message-id",
                    from: { id: "participant-id" },
                    message: "Echo",
                    created_time: "2026-09-22T15:52:00+0000",
                    is_echo: true,
                  },
                  {
                    id: "invalid-message-id",
                    from: { id: "participant-id" },
                    message: "Invalid date",
                    created_time: "not-a-date",
                  },
                  { id: "malformed-message" },
                  null,
                ],
              },
            },
            { id: "conversation-without-messages" },
            null,
          ],
          paging: { next: "https://graph.instagram.com/next-page" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "second-conversation-id",
              messages: {
                data: [
                  {
                    id: "second-message-id",
                    from: { id: "second-participant-id" },
                    message: "Ciao",
                    created_time: "2026-09-22T16:00:00+0000",
                  },
                ],
              },
            },
            { messages: { data: [] } },
            "malformed-conversation",
          ],
        }),
      });

    await expect(
      listInstagramConversationMessages("access-token", "account-id"),
    ).resolves.toEqual({
      messages: [
        {
          conversationId: "conversation-id",
          messageId: "inbound-message-id",
          participantId: "participant-id",
          text: "Sono una modella",
          timestamp: "2026-09-22T15:50:00.000Z",
        },
        {
          conversationId: "second-conversation-id",
          messageId: "second-message-id",
          participantId: "second-participant-id",
          text: "Ciao",
          timestamp: "2026-09-22T16:00:00.000Z",
        },
      ],
      truncated: false,
      outboundMessagesSkipped: 2,
    });

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        "/v26.0/account-id/conversations?platform=instagram",
      ),
      { headers: { Authorization: "Bearer access-token" } },
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "https://graph.instagram.com/next-page",
      { headers: { Authorization: "Bearer access-token" } },
    );
  });

  it("fails when the Conversations API rejects a page", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });

    await expect(
      listInstagramConversationMessages("access-token", "account-id"),
    ).rejects.toThrow("Instagram conversations lookup failed");
  });

  it("follows the nested message cursor for a conversation", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "conversation-id",
              messages: {
                data: [
                  {
                    id: "first-message-id",
                    from: { id: "participant-id" },
                    message: "first",
                    created_time: "2026-09-22T15:00:00+0000",
                  },
                ],
                paging: {
                  next: "https://graph.instagram.com/conversation-messages",
                },
              },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "second-message-id",
              from: { id: "participant-id" },
              message: "second",
              created_time: "2026-09-22T16:00:00+0000",
            },
          ],
        }),
      });

    await expect(
      listInstagramConversationMessages("access-token", "account-id"),
    ).resolves.toMatchObject({
      messages: [
        expect.objectContaining({ messageId: "first-message-id" }),
        expect.objectContaining({ messageId: "second-message-id" }),
      ],
      truncated: false,
      outboundMessagesSkipped: 0,
    });
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "https://graph.instagram.com/conversation-messages",
      { headers: { Authorization: "Bearer access-token" } },
    );
  });

  it("returns no messages when Meta omits the conversation page data", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await expect(
      listInstagramConversationMessages("access-token", "account-id"),
    ).resolves.toEqual({
      messages: [],
      truncated: false,
      outboundMessagesSkipped: 0,
    });
  });
});
