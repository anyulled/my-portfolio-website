import { isCronRequestAuthorized } from "@/services/cron/authorization";

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
