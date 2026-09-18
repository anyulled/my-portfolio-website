jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, options?: { status?: number }) => ({
      status: options?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock("@/services/instagram/auth", () => ({
  getAuthenticatedOperator: jest.fn(),
}));

jest.mock("@/services/instagram/repository", () => ({
  assignLeadCorrelationToken: jest.fn(),
  claimInstagramResponse: jest.fn(),
  getInstagramConversationForDelivery: jest.fn(),
  getInstagramDatabase: jest.fn(),
  markInstagramResponseSent: jest.fn(),
  releaseInstagramResponseClaim: jest.fn(),
  setInstagramReviewDecision: jest.fn(),
}));

jest.mock("@/services/instagram/config", () => ({
  getInstagramPublicUrl: jest.fn(),
}));

jest.mock("@/services/instagram/metaClient", () => ({
  sendInstagramText: jest.fn(),
}));

jest.mock("@/services/instagram/responseTemplates", () => ({
  renderBoundedResponse: jest.fn(),
}));

import { POST } from "@/app/api/instagram/conversations/[conversationId]/decision/route";
import { getAuthenticatedOperator } from "@/services/instagram/auth";
import { getInstagramPublicUrl } from "@/services/instagram/config";
import {
  assignLeadCorrelationToken,
  claimInstagramResponse,
  getInstagramConversationForDelivery,
  getInstagramDatabase,
  markInstagramResponseSent,
  releaseInstagramResponseClaim,
  setInstagramReviewDecision,
} from "@/services/instagram/repository";
import { sendInstagramText } from "@/services/instagram/metaClient";
import { renderBoundedResponse } from "@/services/instagram/responseTemplates";

const database = {} as ReturnType<typeof getInstagramDatabase>;
const conversationId = "conversation-row-id";
const conversation = { id: conversationId, classification: "model_form" };
const deliveryConversation = {
  id: conversationId,
  participant_id: "participant-id",
  last_message_at: "2026-09-13T10:00:00.000Z",
  detected_language: "it",
  response_route: "model_form",
  response_sent_at: null,
  instagram_accounts: {
    handle: "anyulled",
    instagram_user_id: "stored-account-id",
    access_token: "access-token",
  },
};

const createRequest = (body: unknown) =>
  ({ json: async () => body }) as unknown as Request;

const context = {
  params: Promise.resolve({ conversationId }),
};

describe("Instagram conversation decision API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(getAuthenticatedOperator)
      .mockResolvedValue({ id: "operator" } as never);
    jest.mocked(getInstagramDatabase).mockReturnValue(database);
    jest
      .mocked(setInstagramReviewDecision)
      .mockResolvedValue(conversation as never);
    jest
      .mocked(getInstagramConversationForDelivery)
      .mockResolvedValue(deliveryConversation as never);
    jest.mocked(claimInstagramResponse).mockResolvedValue(true);
    jest.mocked(assignLeadCorrelationToken).mockResolvedValue("lead-token");
    jest
      .mocked(getInstagramPublicUrl)
      .mockReturnValue("https://boudoir.barcelona");
    jest.mocked(renderBoundedResponse).mockReturnValue("localized response");
    jest.mocked(sendInstagramText).mockResolvedValue({
      message_id: "sent-message-id",
    });
    jest.mocked(markInstagramResponseSent).mockResolvedValue(undefined);
    jest.mocked(releaseInstagramResponseClaim).mockResolvedValue(undefined);
  });

  it("delivers an approved model form response from a related account object", async () => {
    const response = await POST(
      createRequest({ decision: "model_form" }),
      context,
    );

    expect(response.status).toBe(200);
    expect(sendInstagramText).toHaveBeenCalledWith(
      "access-token",
      "stored-account-id",
      "participant-id",
      "localized response",
    );
    expect(markInstagramResponseSent).toHaveBeenCalledWith(
      database,
      conversationId,
      null,
    );
  });

  it("delivers an approved pricing response without a lead token", async () => {
    const response = await POST(
      createRequest({ decision: "pricing" }),
      context,
    );

    expect(response.status).toBe(200);
    expect(assignLeadCorrelationToken).not.toHaveBeenCalled();
    expect(renderBoundedResponse).toHaveBeenCalledWith(
      "pricing",
      "it",
      "https://boudoir.barcelona/pricing",
    );
    expect(markInstagramResponseSent).toHaveBeenCalledWith(
      database,
      conversationId,
      "2026-09-14T08:00:00.000Z",
    );
  });

  it("rejects unauthenticated decisions", async () => {
    jest.mocked(getAuthenticatedOperator).mockResolvedValue(null);

    const response = await POST(
      createRequest({ decision: "model_form" }),
      context,
    );

    expect(response.status).toBe(401);
  });

  it("rejects malformed decision requests", async () => {
    const response = await POST(
      {
        json: async () => {
          throw new SyntaxError("invalid JSON");
        },
      } as unknown as Request,
      context,
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      message: "Invalid decision request.",
      requestId: expect.any(String),
      resolution: "Retry from the inbox.",
    });
  });

  it("rejects unsupported decisions", async () => {
    const response = await POST(createRequest({ decision: "accept" }), context);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ message: "Invalid review decision" });
  });

  it("rejects a non-object decision request", async () => {
    const response = await POST(createRequest(null), context);

    expect(response.status).toBe(400);
  });

  it("stores an ignore decision without delivery", async () => {
    const response = await POST(createRequest({ decision: "ignore" }), context);

    expect(response.status).toBe(200);
    expect(sendInstagramText).not.toHaveBeenCalled();
  });

  it("returns a diagnosis when the account relation is missing", async () => {
    jest.mocked(getInstagramConversationForDelivery).mockResolvedValue({
      ...deliveryConversation,
      instagram_accounts: null,
    } as never);
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    const response = await POST(
      createRequest({ decision: "model_form" }),
      context,
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.message).toBe("Unable to deliver the Instagram response.");
    expect(consoleError).toHaveBeenCalledWith(
      "instagram_conversation_decision_failed",
      expect.objectContaining({
        error: {
          name: "Error",
          message: "Instagram account is not configured",
        },
      }),
    );
    consoleError.mockRestore();
  });

  it("reports a response claim conflict", async () => {
    jest.mocked(claimInstagramResponse).mockResolvedValue(false);

    const response = await POST(
      createRequest({ decision: "model_form" }),
      context,
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      message: "Conversation response was already claimed.",
      requestId: expect.any(String),
      resolution: "Reload the inbox to see the current conversation state.",
    });
  });

  it("returns a reference and resolution when delivery fails", async () => {
    const error = new Error("Instagram message delivery failed");
    jest.mocked(sendInstagramText).mockRejectedValue(error);
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    const response = await POST(
      createRequest({ decision: "model_form" }),
      context,
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      message: "Unable to deliver the Instagram response.",
      requestId: expect.any(String),
      resolution:
        "Retry the decision. If delivery still fails, check the connected Instagram account and Meta messaging permission.",
    });
    expect(releaseInstagramResponseClaim).toHaveBeenCalledWith(
      database,
      conversationId,
      error.message,
    );
    expect(consoleError).toHaveBeenCalledWith(
      "instagram_conversation_decision_failed",
      expect.objectContaining({
        requestId: body.requestId,
        conversationId,
        error: { name: "Error", message: error.message },
      }),
    );
    consoleError.mockRestore();
  });

  it("sanitizes an unknown delivery failure", async () => {
    jest
      .mocked(sendInstagramText)
      .mockRejectedValue("Meta rejected the message");
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    const response = await POST(
      createRequest({ decision: "model_form" }),
      context,
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(releaseInstagramResponseClaim).toHaveBeenCalledWith(
      database,
      conversationId,
      "Instagram delivery failed",
    );
    expect(consoleError).toHaveBeenCalledWith(
      "instagram_conversation_decision_failed",
      expect.objectContaining({
        error: {
          name: "UnknownError",
          message: "Unknown Instagram decision error",
        },
      }),
    );
    expect(body.requestId).toEqual(expect.any(String));
    consoleError.mockRestore();
  });

  it("returns a conflict for a conversation that is no longer pending", async () => {
    jest
      .mocked(setInstagramReviewDecision)
      .mockRejectedValue(
        new Error("Conversation is no longer awaiting review"),
      );

    const response = await POST(
      createRequest({ decision: "model_form" }),
      context,
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      message: "Conversation is no longer awaiting review.",
      requestId: expect.any(String),
      resolution: "Reload the inbox to see the current conversation state.",
    });
  });
});
