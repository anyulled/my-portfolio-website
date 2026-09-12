import { sendInstagramText } from "@/services/instagram/metaClient";

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
});
