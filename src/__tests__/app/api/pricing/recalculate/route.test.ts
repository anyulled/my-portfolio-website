/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */

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
  let GET: any;
  let database: any;
  let ipc: any;
  let mailer: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.PRICING_RECALC_SECRET = "test-secret";
    process.env.CRON_NOTIFICATION_EMAIL = "test@example.com";

    // Require modules after mocks
    database = require("@/services/database");
    ipc = require("@/services/ipc");
    mailer = require("@/services/mailer");

    // Log suppression
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Require the route handler
    const route = require("@/app/api/pricing/recalculate/route");
    GET = route.GET;
  });

  it("should return 401 for invalid token", async () => {
    const req = {
      url: "http://localhost/api/pricing/recalculate",
      headers: {
        get: (key: string) =>
          key === "x-cron-secret" ? "invalid-secret" : null,
        has: () => false,
      },
    } as unknown as Request;

    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Unauthorized");
  });

  it("should recalculate pricing and send email on valid request", async () => {
    database.getLatestPricing.mockResolvedValue({
      express_price: 100,
      experience_price: 200,
      deluxe_price: 300,
    });
    ipc.fetchLatestIpc.mockResolvedValue(5.0);
    database.insertPricing.mockResolvedValue({
      express_price: 105,
      experience_price: 210,
      deluxe_price: 315,
    });

    const req = {
      url: "http://localhost/api/pricing/recalculate",
      headers: {
        get: (key: string) => (key === "x-cron-secret" ? "test-secret" : null),
        has: () => false,
      },
    } as unknown as Request;

    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);

    expect(mailer.sendEmailToRecipient).toHaveBeenCalledWith(
      expect.stringContaining("IPC Percentage Used: 5%"),
      "test@example.com",
      expect.any(String),
    );
  });
});
