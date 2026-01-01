import { commonBeforeEach } from "@/__tests__/utils/testUtils";

// Mock next/server before requiring the route
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status ?? 200,
    })),
  },
}));

jest.mock("@/services/database");
jest.mock("@/services/ipc");
jest.mock("@/services/mailer");
jest.mock("chalk", () => ({
  green: jest.fn((msg) => msg),
  cyan: jest.fn((msg) => msg),
  red: jest.fn((msg) => msg),
  yellow: jest.fn((msg) => msg),
  gray: jest.fn((msg) => msg),
}));

describe("Pricing Recalculate Route", () => {
  const context = {
    GET: null as any,
    database: null as any,
    ipc: null as any,
    mailer: null as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.PRICING_RECALC_SECRET = "test-secret";
    process.env.CRON_NOTIFICATION_EMAIL = "test@example.com";

    // Require modules after mocks
    context.database = require("@/services/database");
    context.ipc = require("@/services/ipc");
    context.mailer = require("@/services/mailer");
    context.GET = require("@/app/api/pricing/recalculate/route").GET;

    commonBeforeEach();
  });

  it("should return 401 if unauthorized", async () => {
    const request = new Request(
      "http://localhost/api/pricing/recalculate",
      {
        headers: {
          authorization: "Bearer invalid",
        },
      },
    );

    const response = await context.GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should recalculate and return results", async () => {
    context.database.recalculatePrices.mockResolvedValue({
      total: 10,
      updated: 10,
    });
    context.ipc.getLatestIPC.mockResolvedValue(3.5);

    const request = new Request(
      "http://localhost/api/pricing/recalculate",
      {
        headers: {
          authorization: "Bearer test-secret",
        },
      },
    );

    const response = await context.GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.results.updated).toBe(10);
    expect(context.mailer.sendEmail).toHaveBeenCalled();
  });

  it("should handle partial success", async () => {
    context.database.recalculatePrices.mockResolvedValue({
      total: 10,
      updated: 5,
    });
    context.ipc.getLatestIPC.mockResolvedValue(3.5);

    const request = new Request(
      "http://localhost/api/pricing/recalculate",
      {
        headers: {
          authorization: "Bearer test-secret",
        },
      },
    );

    const response = await context.GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.results.updated).toBe(5);
  });
});
