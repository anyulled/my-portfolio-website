const callbacks: Array<() => Promise<void>> = [];

jest.mock("next/server", () => ({
  after: jest.fn((callback: () => Promise<void>) => callbacks.push(callback)),
  NextResponse: {
    json: (body: unknown, options?: { status?: number }) => ({
      status: options?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock("@/services/cron/authorization", () => ({
  isInstagramFollowupRequestAuthorized: jest.fn(),
}));

jest.mock("@/services/instagram/followups", () => ({
  processInstagramFollowups: jest.fn(),
}));

jest.mock("@/services/instagram/sync", () => ({
  syncInstagramConversations: jest.fn(),
}));

import { POST } from "@/app/api/instagram-followups/route";
import { isInstagramFollowupRequestAuthorized } from "@/services/cron/authorization";
import { processInstagramFollowups } from "@/services/instagram/followups";
import { syncInstagramConversations } from "@/services/instagram/sync";

describe("Instagram follow-up endpoint", () => {
  const request = {} as Request;

  beforeEach(() => {
    callbacks.length = 0;
    jest.clearAllMocks();
    jest.mocked(isInstagramFollowupRequestAuthorized).mockReturnValue(false);
    jest.mocked(processInstagramFollowups).mockResolvedValue({
      candidates: 1,
      sent: 1,
      cancelled: 0,
      failed: 0,
    });
    jest.mocked(syncInstagramConversations).mockResolvedValue({
      accounts: 2,
      messagesSeen: 0,
      outboundMessagesSkipped: 0,
      duplicatesSkipped: 0,
      messagesProcessed: 0,
      failures: 0,
    });
  });

  it("rejects unauthorized requests", async () => {
    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(callbacks).toHaveLength(0);
  });

  it("returns 202 before after processing completes", async () => {
    jest.mocked(isInstagramFollowupRequestAuthorized).mockReturnValue(true);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toEqual({ accepted: true, requestId: expect.any(String) });
    expect(processInstagramFollowups).not.toHaveBeenCalled();
    expect(callbacks).toHaveLength(1);

    await callbacks[0]();
    expect(syncInstagramConversations).toHaveBeenCalledTimes(1);
    expect(processInstagramFollowups).toHaveBeenCalledTimes(1);
  });

  it("logs a safe asynchronous failure", async () => {
    jest.mocked(isInstagramFollowupRequestAuthorized).mockReturnValue(true);
    jest
      .mocked(processInstagramFollowups)
      .mockRejectedValue(new Error("database unavailable"));
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    await POST(request);
    await callbacks[0]();

    expect(consoleError).toHaveBeenCalledWith(
      "instagram_followups_failed",
      expect.objectContaining({ error: "database unavailable" }),
    );
    consoleError.mockRestore();
  });

  it("sanitizes an unknown asynchronous failure", async () => {
    jest.mocked(isInstagramFollowupRequestAuthorized).mockReturnValue(true);
    jest
      .mocked(processInstagramFollowups)
      .mockRejectedValue("database unavailable");
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    await POST(request);
    await callbacks[0]();

    expect(consoleError).toHaveBeenCalledWith(
      "instagram_followups_failed",
      expect.objectContaining({ error: "Unknown error" }),
    );
    consoleError.mockRestore();
  });

  it("logs a safe synchronization failure and continues to follow-ups", async () => {
    jest.mocked(isInstagramFollowupRequestAuthorized).mockReturnValue(true);
    jest
      .mocked(syncInstagramConversations)
      .mockRejectedValue(new Error("Meta unavailable"));
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    await POST(request);
    await callbacks[0]();

    expect(consoleError).toHaveBeenCalledWith(
      "instagram_conversations_sync_failed",
      expect.objectContaining({ error: "Meta unavailable" }),
    );
    expect(processInstagramFollowups).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });

  it("sanitizes an unknown synchronization failure", async () => {
    jest.mocked(isInstagramFollowupRequestAuthorized).mockReturnValue(true);
    jest
      .mocked(syncInstagramConversations)
      .mockRejectedValue("Meta unavailable");
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    await POST(request);
    await callbacks[0]();

    expect(consoleError).toHaveBeenCalledWith(
      "instagram_conversations_sync_failed",
      expect.objectContaining({ error: "Unknown error" }),
    );
    consoleError.mockRestore();
  });
});
