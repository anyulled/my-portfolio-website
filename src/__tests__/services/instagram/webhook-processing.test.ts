jest.mock("@/services/instagram/repository", () => ({
  assignLeadCorrelationToken: jest.fn(),
  claimInstagramResponse: jest.fn(),
  findInstagramAccount: jest.fn(),
  getInstagramDatabase: jest.fn(),
  markInstagramResponseSent: jest.fn(),
  recordInstagramMessage: jest.fn(),
  releaseInstagramResponseClaim: jest.fn(),
}));

jest.mock("@/services/instagram/classifier", () => ({
  classifyInstagramMessage: jest.fn(),
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

import { classifyInstagramMessage } from "@/services/instagram/classifier";
import { getInstagramPublicUrl } from "@/services/instagram/config";
import {
  assignLeadCorrelationToken,
  claimInstagramResponse,
  findInstagramAccount,
  getInstagramDatabase,
  markInstagramResponseSent,
  recordInstagramMessage,
  releaseInstagramResponseClaim,
} from "@/services/instagram/repository";
import { sendInstagramText } from "@/services/instagram/metaClient";
import { renderBoundedResponse } from "@/services/instagram/responseTemplates";
import {
  processInstagramWebhookMessage,
  InstagramWebhookProcessingError,
} from "@/services/instagram/webhook";

const database = {} as ReturnType<typeof getInstagramDatabase>;
const account = {
  id: "account-row-id",
  handle: "anyulled",
  instagram_user_id: "stored-account-id",
  access_token: "access-token",
};
const conversation = { id: "conversation-row-id" };
const message = {
  accountInstagramUserId: "entry-account-id",
  accountInstagramUserIdCandidates: [
    "entry-account-id",
    "recipient-account-id",
  ],
  conversationId: "conversation-id",
  messageId: "message-id",
  participantId: "participant-id",
  text: "Sono una modella e sarò a Barcellona per un servizio pagato.",
  timestamp: "2026-09-13T14:34:52.000Z",
};
const classification = {
  route: "model_form",
  detectedLanguage: "it",
  confidence: 0.95,
  isModel: true,
  mentionsBarcelona: true,
  mentionsPhotographyWork: true,
  isPotentialClient: false,
  reason: "Clear paid model availability enquiry.",
};

describe("processInstagramWebhookMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getInstagramDatabase).mockReturnValue(database);
    jest.mocked(findInstagramAccount).mockResolvedValue(account as never);
    jest
      .mocked(classifyInstagramMessage)
      .mockResolvedValue(classification as never);
    jest.mocked(recordInstagramMessage).mockResolvedValue({
      conversation,
      shouldRespond: true,
    } as never);
    jest.mocked(claimInstagramResponse).mockResolvedValue(true);
    jest
      .mocked(assignLeadCorrelationToken)
      .mockResolvedValue("lead-token" as never);
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

  it("resolves the account using the identifiers supplied by Meta", async () => {
    await processInstagramWebhookMessage(message);

    expect(findInstagramAccount).toHaveBeenCalledWith(database, [
      "entry-account-id",
      "recipient-account-id",
    ]);
  });

  it("returns the classification when persistence does not require a response", async () => {
    jest.mocked(recordInstagramMessage).mockResolvedValue({
      conversation: null,
      shouldRespond: false,
    } as never);

    await expect(processInstagramWebhookMessage(message)).resolves.toBe(
      "model_form",
    );
    expect(claimInstagramResponse).not.toHaveBeenCalled();
  });

  it("does not claim a manual review response", async () => {
    jest.mocked(classifyInstagramMessage).mockResolvedValue({
      ...classification,
      route: "manual_review",
    } as never);

    await expect(processInstagramWebhookMessage(message)).resolves.toBe(
      "manual_review",
    );
    expect(claimInstagramResponse).not.toHaveBeenCalled();
  });

  it("does not send a duplicate response after another worker claims it", async () => {
    jest.mocked(classifyInstagramMessage).mockResolvedValue({
      ...classification,
      route: "pricing",
    } as never);
    jest.mocked(claimInstagramResponse).mockResolvedValue(false);

    await expect(processInstagramWebhookMessage(message)).resolves.toBe(
      "already_claimed",
    );
    expect(sendInstagramText).not.toHaveBeenCalled();
  });

  it("sends the model form response through the originating account", async () => {
    await expect(processInstagramWebhookMessage(message)).resolves.toBe(
      "model_form",
    );

    expect(assignLeadCorrelationToken).toHaveBeenCalledWith(
      database,
      "conversation-row-id",
    );
    expect(renderBoundedResponse).toHaveBeenCalledWith(
      "model_form",
      "it",
      "https://boudoir.barcelona/booking-a-session?lead=lead-token",
    );
    expect(sendInstagramText).toHaveBeenCalledWith(
      "access-token",
      "stored-account-id",
      "participant-id",
      "localized response",
    );
    expect(markInstagramResponseSent).toHaveBeenCalledWith(
      database,
      "conversation-row-id",
      null,
    );
  });

  it("sends a pricing response without a lead token", async () => {
    jest.mocked(classifyInstagramMessage).mockResolvedValue({
      ...classification,
      route: "pricing",
      isModel: false,
      isPotentialClient: true,
    } as never);

    await expect(processInstagramWebhookMessage(message)).resolves.toBe(
      "pricing",
    );

    expect(assignLeadCorrelationToken).not.toHaveBeenCalled();
    expect(renderBoundedResponse).toHaveBeenCalledWith(
      "pricing",
      "it",
      "https://boudoir.barcelona/pricing",
    );
  });

  it("releases the response claim and reports delivery failures", async () => {
    const error = new Error("Instagram message delivery failed");
    jest.mocked(sendInstagramText).mockRejectedValue(error);

    await expect(processInstagramWebhookMessage(message)).rejects.toMatchObject(
      {
        name: "InstagramWebhookProcessingError",
        stage: "response_delivery",
        message: "Instagram message delivery failed",
      },
    );
    expect(releaseInstagramResponseClaim).toHaveBeenCalledWith(
      database,
      "conversation-row-id",
      "Instagram message delivery failed",
    );
    expect(markInstagramResponseSent).not.toHaveBeenCalled();
  });

  it("uses a generic message when a response delivery failure is not an Error", async () => {
    jest
      .mocked(sendInstagramText)
      .mockRejectedValue("Meta rejected the message");

    await expect(processInstagramWebhookMessage(message)).rejects.toMatchObject(
      {
        name: "InstagramWebhookProcessingError",
        stage: "response_delivery",
        message: "Instagram webhook processing failed",
      },
    );
    expect(releaseInstagramResponseClaim).toHaveBeenCalledWith(
      database,
      "conversation-row-id",
      "Instagram processing failed",
    );
  });

  it("uses a generic message when an early failure is not an Error", async () => {
    jest.mocked(findInstagramAccount).mockRejectedValue("lookup failed");

    await expect(processInstagramWebhookMessage(message)).rejects.toMatchObject(
      {
        name: "InstagramWebhookProcessingError",
        stage: "account_lookup",
        message: "Instagram webhook processing failed",
      },
    );
  });

  it.each([
    ["account_lookup", findInstagramAccount],
    ["classification", classifyInstagramMessage],
    ["persistence", recordInstagramMessage],
  ] as const)(
    "wraps %s failures with their processing stage",
    async (stage, operation) => {
      const error = new Error(`${stage} failed`);
      jest.mocked(operation).mockRejectedValue(error);

      await expect(processInstagramWebhookMessage(message)).rejects.toEqual(
        expect.objectContaining<Partial<InstagramWebhookProcessingError>>({
          name: "InstagramWebhookProcessingError",
          stage,
          message: `${stage} failed`,
        }),
      );
    },
  );
});
