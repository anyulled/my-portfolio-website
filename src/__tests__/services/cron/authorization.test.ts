import {
  isCronRequestAuthorized,
  isInstagramFollowupRequestAuthorized,
} from "@/services/cron/authorization";

describe("Cron request authorization", () => {
  const originalSecret = process.env.CRON_SECRET;
  const createRequest = (authorization: string | null) => ({
    headers: {
      get: () => authorization,
    },
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_SECRET;
      return;
    }

    process.env.CRON_SECRET = originalSecret;
  });

  it("rejects requests when the cron secret is not configured", () => {
    delete process.env.CRON_SECRET;
    const request = createRequest(null);

    const authorized = isCronRequestAuthorized(request);

    expect(authorized).toBe(false);
  });

  it("rejects requests with an invalid bearer token", () => {
    process.env.CRON_SECRET = "expected-secret";
    const request = createRequest("Bearer invalid-secret");

    const authorized = isCronRequestAuthorized(request);

    expect(authorized).toBe(false);
  });

  it("accepts requests with the configured bearer token", () => {
    process.env.CRON_SECRET = "expected-secret";
    const request = createRequest("Bearer expected-secret");

    const authorized = isCronRequestAuthorized(request);

    expect(authorized).toBe(true);
  });
});

describe("Instagram follow-up authorization", () => {
  const originalToken = process.env.INSTAGRAM_FOLLOWUP_CRON_TOKEN;
  const createRequest = (authorization: string | null) => ({
    headers: { get: () => authorization },
  });

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.INSTAGRAM_FOLLOWUP_CRON_TOKEN;
    } else {
      process.env.INSTAGRAM_FOLLOWUP_CRON_TOKEN = originalToken;
    }
  });

  it.each([null, "Bearer invalid-token"])("rejects %s", (authorization) => {
    process.env.INSTAGRAM_FOLLOWUP_CRON_TOKEN = "expected-token";

    expect(
      isInstagramFollowupRequestAuthorized(createRequest(authorization)),
    ).toBe(false);
  });

  it("rejects requests when the follow-up token is not configured", () => {
    delete process.env.INSTAGRAM_FOLLOWUP_CRON_TOKEN;

    expect(
      isInstagramFollowupRequestAuthorized(createRequest("Bearer token")),
    ).toBe(false);
  });

  it("accepts the configured bearer token", () => {
    process.env.INSTAGRAM_FOLLOWUP_CRON_TOKEN = "expected-token";

    expect(
      isInstagramFollowupRequestAuthorized(
        createRequest("Bearer expected-token"),
      ),
    ).toBe(true);
  });
});
