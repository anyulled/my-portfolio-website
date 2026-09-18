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
    });
  });

  it("does not send when another worker owns the claim", async () => {
    jest.mocked(claimInstagramFollowup).mockResolvedValue(false);

    await expect(processInstagramFollowups(database, now)).resolves.toEqual({
      candidates: 1,
      sent: 0,
      cancelled: 0,
      failed: 0,
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
});
