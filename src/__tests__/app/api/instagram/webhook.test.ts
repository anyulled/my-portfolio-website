jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, options?: { status?: number }) => ({
      status: options?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock("@/services/instagram/webhook", () => ({
  parseInstagramWebhookPayload: jest.fn(),
  processInstagramWebhookMessage: jest.fn(),
}));

import { POST } from "@/app/api/instagram/webhook/route";
import {
  parseInstagramWebhookPayload,
  processInstagramWebhookMessage,
} from "@/services/instagram/webhook";

const request = {
  json: jest.fn(),
} as unknown as Request;

const message = {
  accountInstagramUserId: "entry-account-id",
  accountInstagramUserIdCandidates: [
    "entry-account-id",
    "recipient-account-id",
  ],
  conversationId: "conversation-id",
  messageId: "message-id",
  participantId: "participant-id",
  text: "message text that must not be logged",
  timestamp: "2026-09-13T14:34:52.000Z",
};

describe("Instagram webhook API", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("acknowledges a batch when every message is processed", async () => {
    jest.mocked(request.json).mockResolvedValue({});
    jest.mocked(parseInstagramWebhookPayload).mockReturnValue([message]);
    jest
      .mocked(processInstagramWebhookMessage)
      .mockResolvedValue("ignore" as never);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      received: 1,
      failures: 0,
      requestId: expect.any(String),
    });
  });

  it("logs a safe actionable error when message processing fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const error = Object.assign(
      new Error("Instagram account is not configured"),
      { stage: "account_lookup" },
    );
    jest.mocked(request.json).mockResolvedValue({});
    jest.mocked(parseInstagramWebhookPayload).mockReturnValue([message]);
    jest.mocked(processInstagramWebhookMessage).mockRejectedValue(error);

    const response = await POST(request);
    const body = await response.json();
    const log = JSON.parse(consoleError.mock.calls[0][0] as string) as Record<
      string,
      unknown
    >;

    expect(response.status).toBe(503);
    expect(body).toEqual({
      received: 1,
      failures: 1,
      requestId: expect.any(String),
    });
    expect(log).toEqual({
      event: "instagram_webhook_message_failed",
      requestId: body.requestId,
      messageIndex: 0,
      accountInstagramUserId: "entry-account-id",
      messageId: "message-id",
      stage: "account_lookup",
      resolution:
        "Reconnect the Instagram account or verify the account identifier delivered by Meta.",
      error: {
        name: "Error",
        message: "Instagram account is not configured",
      },
    });
    expect(consoleError.mock.calls[0][0]).not.toContain(message.text);
    consoleError.mockRestore();
  });

  it("logs malformed webhook requests and returns a retryable failure", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    jest
      .mocked(request.json)
      .mockRejectedValue(new SyntaxError("invalid JSON"));

    const response = await POST(request);
    const body = await response.json();
    const log = JSON.parse(consoleError.mock.calls[0][0] as string) as Record<
      string,
      unknown
    >;

    expect(response.status).toBe(503);
    expect(body).toEqual({
      success: false,
      message: "Instagram webhook processing failed",
      requestId: expect.any(String),
    });
    expect(log).toEqual({
      event: "instagram_webhook_request_failed",
      requestId: body.requestId,
      error: { name: "SyntaxError", message: "invalid JSON" },
    });
    consoleError.mockRestore();
  });

  it("keeps unknown non-error failures safe and actionable", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    jest.mocked(request.json).mockResolvedValue({});
    jest.mocked(parseInstagramWebhookPayload).mockReturnValue([message]);
    jest.mocked(processInstagramWebhookMessage).mockRejectedValue(null);

    await POST(request);
    const log = JSON.parse(consoleError.mock.calls[0][0] as string) as Record<
      string,
      unknown
    >;

    expect(log).toEqual(
      expect.objectContaining({
        stage: "unknown",
        resolution:
          "Inspect the Vercel log details for the failing webhook request.",
        error: {
          name: "UnknownError",
          message: "Unknown webhook processing error",
        },
      }),
    );
    consoleError.mockRestore();
  });

  it("falls back to the unknown stage for invalid processing stage metadata", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const error = Object.assign(new Error("invalid stage"), {
      stage: "invalid_stage",
    });
    jest.mocked(request.json).mockResolvedValue({});
    jest.mocked(parseInstagramWebhookPayload).mockReturnValue([message]);
    jest.mocked(processInstagramWebhookMessage).mockRejectedValue(error);

    await POST(request);
    const log = JSON.parse(consoleError.mock.calls[0][0] as string) as Record<
      string,
      unknown
    >;

    expect(log).toEqual(expect.objectContaining({ stage: "unknown" }));
    consoleError.mockRestore();
  });
});
