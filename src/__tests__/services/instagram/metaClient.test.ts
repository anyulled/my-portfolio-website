import {
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
});
