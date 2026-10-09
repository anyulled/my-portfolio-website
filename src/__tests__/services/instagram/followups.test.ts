jest.mock("@/services/instagram/repository", () => ({
  getInstagramDatabase: jest.fn(),
  getInstagramInitialInboundMessage: jest.fn(),
}));
jest.mock("@/services/instagram/replies", () => ({
  generateInstagramReply: jest.fn(),
}));
import { getInstagramInitialInboundMessage } from "@/services/instagram/repository";
import { generateInstagramReply } from "@/services/instagram/replies";
jest.mock("@/services/instagram/followupRepository", () => ({
  beginInstagramFollowupDelivery: jest.fn(),
  cancelInstagramFollowup: jest.fn(),
  claimInstagramFollowup: jest.fn(),
  listInstagramFollowupCandidates: jest.fn(),
  markInstagramFollowupForReconciliation: jest.fn(),
  markInstagramFollowupSent: jest.fn(),
  releaseInstagramFollowupClaim: jest.fn(),
}));

jest.mock("@/services/instagram/config", () => ({
  getInstagramPublicUrl: jest.fn(() => "https://boudoir.barcelona"),
}));

jest.mock("@/services/instagram/metaClient", () => ({
  sendInstagramText: jest.fn(),
}));

import {
  beginInstagramFollowupDelivery,
  cancelInstagramFollowup,
  claimInstagramFollowup,
  listInstagramFollowupCandidates,
  markInstagramFollowupForReconciliation,
  markInstagramFollowupSent,
  releaseInstagramFollowupClaim,
} from "@/services/instagram/followupRepository";
import { sendInstagramText } from "@/services/instagram/metaClient";
import {
  INSTAGRAM_FOLLOWUP_DELAY_MS,
  processInstagramFollowups,
} from "@/services/instagram/followups";

const database = {} as never;
const now = new Date("2026-09-18T12:00:00.000Z");
const candidate = {
  confidence: 0.95,
  id: "conversation-id",
  participantId: "participant-id",
  detectedLanguage: "it",
  lastMessageAt: "2026-09-17T13:00:00.000Z",
  followUpDueAt: new Date(now.getTime() - 1).toISOString(),
  followUpAttempts: 0,
  deliveryStartedAt: null,
  account: {
    handle: "anyulled" as const,
    instagramUserId: "account-id",
    accessToken: "secret-token",
  },
};

describe("processInstagramFollowups", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getInstagramInitialInboundMessage).mockResolvedValue({
      sent_at: candidate.lastMessageAt,
      message_text: "Ciao! Vorrei conoscere i prezzi 😊",
    });
    jest
      .mocked(generateInstagramReply)
      .mockResolvedValue("Hai domande? https://boudoir.barcelona/pricing");
    jest.mocked(listInstagramFollowupCandidates).mockResolvedValue([candidate]);
    jest.mocked(claimInstagramFollowup).mockResolvedValue(true);
    jest.mocked(beginInstagramFollowupDelivery).mockResolvedValue(true);
    jest
      .mocked(sendInstagramText)
      .mockResolvedValue({ message_id: "message-id" });
    jest.mocked(markInstagramFollowupSent).mockResolvedValue(true);
    jest
      .mocked(markInstagramFollowupForReconciliation)
      .mockResolvedValue(undefined);
    jest.mocked(cancelInstagramFollowup).mockResolvedValue(undefined);
    jest.mocked(releaseInstagramFollowupClaim).mockResolvedValue(undefined);
  });

  it("claims and sends the localized pricing follow-up", async () => {
    const summary = await processInstagramFollowups(database, now);

    expect(claimInstagramFollowup).toHaveBeenCalledWith(
      database,
      "conversation-id",
      1,
      now.toISOString(),
      expect.any(String),
    );
    expect(beginInstagramFollowupDelivery).toHaveBeenCalledWith(
      database,
      "conversation-id",
      expect.any(String),
      now.toISOString(),
      null,
    );
    expect(sendInstagramText).toHaveBeenCalledWith(
      "secret-token",
      "account-id",
      "participant-id",
      expect.stringContaining("https://boudoir.barcelona/pricing"),
    );
    expect(markInstagramFollowupSent).toHaveBeenCalledWith(
      database,
      "conversation-id",
      expect.any(String),
      "message-id",
    );
    expect(summary).toEqual({
      candidates: 1,
      sent: 1,
      cancelled: 0,
      failed: 0,
      reconciled: 0,
    });
  });

  it("does not send when another worker owns the claim", async () => {
    jest.mocked(claimInstagramFollowup).mockResolvedValue(false);

    await expect(processInstagramFollowups(database, now)).resolves.toEqual({
      candidates: 1,
      sent: 0,
      cancelled: 0,
      failed: 0,
      reconciled: 0,
    });
    expect(sendInstagramText).not.toHaveBeenCalled();
  });

  it("cancels candidates outside the safe Meta window", async () => {
    const lateNow = new Date(
      new Date(candidate.lastMessageAt).getTime() + 23.5 * 60 * 60 * 1000,
    );

    await expect(processInstagramFollowups(database, lateNow)).resolves.toEqual(
      {
        candidates: 1,
        sent: 0,
        cancelled: 1,
        failed: 0,
        reconciled: 0,
      },
    );
    expect(cancelInstagramFollowup).toHaveBeenCalledWith(
      database,
      "conversation-id",
      "Instagram follow-up window is closing",
    );
    expect(claimInstagramFollowup).not.toHaveBeenCalled();
  });

  it("marks the third failed attempt as needing attention", async () => {
    const error = new Error("Meta rejected the message");
    jest.mocked(sendInstagramText).mockRejectedValue(error);
    jest
      .mocked(listInstagramFollowupCandidates)
      .mockResolvedValue([{ ...candidate, followUpAttempts: 2 }]);

    await processInstagramFollowups(database, now);

    expect(releaseInstagramFollowupClaim).toHaveBeenCalledWith(
      database,
      "conversation-id",
      expect.any(String),
      error.message,
      true,
    );
  });

  it("uses a retryable state before the third attempt", async () => {
    const error = new Error("temporary failure");
    jest.mocked(sendInstagramText).mockRejectedValue(error);

    await processInstagramFollowups(database, now);

    expect(releaseInstagramFollowupClaim).toHaveBeenCalledWith(
      database,
      "conversation-id",
      expect.any(String),
      error.message,
      false,
    );
  });

  it("sanitizes unknown delivery failures", async () => {
    jest.mocked(sendInstagramText).mockRejectedValue("Meta rejected");

    await processInstagramFollowups(database, now);

    expect(releaseInstagramFollowupClaim).toHaveBeenCalledWith(
      database,
      "conversation-id",
      expect.any(String),
      "Instagram follow-up failed",
      false,
    );
  });

  it("keeps the 22-hour schedule explicit", () => {
    expect(INSTAGRAM_FOLLOWUP_DELAY_MS).toBe(22 * 60 * 60 * 1000);
  });

  it("does not send after cancellation invalidates delivery ownership", async () => {
    jest.mocked(beginInstagramFollowupDelivery).mockResolvedValue(false);

    await processInstagramFollowups(database, now);

    expect(sendInstagramText).not.toHaveBeenCalled();
  });

  it("records delivered messages for reconciliation when finalization fails", async () => {
    jest
      .mocked(markInstagramFollowupSent)
      .mockRejectedValue(new Error("database unavailable"));

    await expect(processInstagramFollowups(database, now)).resolves.toEqual({
      candidates: 1,
      sent: 0,
      cancelled: 0,
      failed: 1,
      reconciled: 0,
    });
    expect(markInstagramFollowupForReconciliation).toHaveBeenCalledWith(
      database,
      "conversation-id",
      expect.any(String),
      "message-id",
      "database unavailable",
    );
    expect(releaseInstagramFollowupClaim).not.toHaveBeenCalled();
  });

  it("does not count delivery as sent when ownership is lost before finalization", async () => {
    jest.mocked(markInstagramFollowupSent).mockResolvedValue(false);

    await expect(processInstagramFollowups(database, now)).resolves.toEqual({
      candidates: 1,
      sent: 0,
      cancelled: 0,
      failed: 1,
      reconciled: 0,
    });
  });

  it("makes successful deliveries without identifiers non-retryable", async () => {
    jest.mocked(sendInstagramText).mockResolvedValue({
      recipient_id: "participant-id",
    });

    await processInstagramFollowups(database, now);

    expect(markInstagramFollowupForReconciliation).toHaveBeenCalledWith(
      database,
      "conversation-id",
      expect.any(String),
      null,
      "Instagram delivery identifier was not returned",
    );
    expect(releaseInstagramFollowupClaim).not.toHaveBeenCalled();
  });
  it.each([0.9, 0.89, Number.NaN])(
    "holds low-confidence followups (%s)",
    async (confidence) => {
      jest
        .mocked(listInstagramFollowupCandidates)
        .mockResolvedValue([{ ...candidate, confidence }]);
      expect((await processInstagramFollowups(database, now)).cancelled).toBe(
        1,
      );
      expect(generateInstagramReply).not.toHaveBeenCalled();
      expect(sendInstagramText).not.toHaveBeenCalled();
    },
  );
  it("generates a followup from the original sender message before beginning delivery", async () => {
    await processInstagramFollowups(database, now);
    expect(generateInstagramReply).toHaveBeenCalledWith(
      "pricing_followup",
      "it",
      "Ciao! Vorrei conoscere i prezzi 😊",
      "https://boudoir.barcelona/pricing",
    );
    expect(
      jest.mocked(generateInstagramReply).mock.invocationCallOrder[0],
    ).toBeLessThan(
      jest.mocked(beginInstagramFollowupDelivery).mock.invocationCallOrder[0],
    );
  });
  it("does not begin delivery when Groq is unavailable", async () => {
    jest
      .mocked(generateInstagramReply)
      .mockRejectedValue(new Error("Groq unavailable"));
    expect((await processInstagramFollowups(database, now)).failed).toBe(1);
    expect(beginInstagramFollowupDelivery).not.toHaveBeenCalled();
    expect(sendInstagramText).not.toHaveBeenCalled();
    expect(releaseInstagramFollowupClaim).toHaveBeenCalledWith(
      database,
      candidate.id,
      expect.any(String),
      "Groq unavailable",
      false,
    );
  });
  it("reconciles interrupted deliveries before generation without releasing them for resend", async () => {
    const deliveryStartedAt = now.toISOString();
    jest
      .mocked(listInstagramFollowupCandidates)
      .mockResolvedValue([{ ...candidate, deliveryStartedAt }]);
    jest.mocked(beginInstagramFollowupDelivery).mockResolvedValue(false);
    expect(await processInstagramFollowups(database, now)).toMatchObject({
      reconciled: 1,
      failed: 0,
      sent: 0,
    });
    expect(beginInstagramFollowupDelivery).toHaveBeenCalledWith(
      database,
      candidate.id,
      expect.any(String),
      now.toISOString(),
      deliveryStartedAt,
    );
    expect(generateInstagramReply).not.toHaveBeenCalled();
    expect(sendInstagramText).not.toHaveBeenCalled();
    expect(releaseInstagramFollowupClaim).not.toHaveBeenCalled();
  });
  it("stops after the third failed generation without beginning delivery", async () => {
    jest
      .mocked(listInstagramFollowupCandidates)
      .mockResolvedValue([{ ...candidate, followUpAttempts: 2 }]);
    jest
      .mocked(generateInstagramReply)
      .mockRejectedValue(new Error("Groq unavailable"));
    await processInstagramFollowups(database, now);
    expect(releaseInstagramFollowupClaim).toHaveBeenCalledWith(
      database,
      candidate.id,
      expect.any(String),
      "Groq unavailable",
      true,
    );
    expect(beginInstagramFollowupDelivery).not.toHaveBeenCalled();
  });
  it("processes multiple conversations serially and aggregates delivery outcomes", async () => {
    jest
      .mocked(listInstagramFollowupCandidates)
      .mockResolvedValue([
        candidate,
        { ...candidate, id: "second-conversation" },
      ]);
    expect((await processInstagramFollowups(database, now)).sent).toBe(2);
    expect(
      jest.mocked(markInstagramFollowupSent).mock.invocationCallOrder[0],
    ).toBeLessThan(
      jest.mocked(generateInstagramReply).mock.invocationCallOrder[1],
    );
  });
});
