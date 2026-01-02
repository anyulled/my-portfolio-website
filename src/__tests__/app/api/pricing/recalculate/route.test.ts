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

    // Polyfill Request for Node environment with proper headers implementation
    globalThis.Request ??= class Request {
      url: string;
      headers: any;

      constructor(url: string, init?: any) {
        this.url = url;
        // Create headers object with get() and has() methods
        const headersMap = new Map<string, string>();
        if (init?.headers) {
          Object.entries(init.headers).forEach(([key, value]) => {
            headersMap.set(key.toLowerCase(), value as string);
          });
        }
        this.headers = {
          get: (key: string) => headersMap.get(key.toLowerCase()) || null,
          has: (key: string) => headersMap.has(key.toLowerCase()),
        };
      }
    } as any;

    // Require modules after mocks
    context.database = require("@/services/database");
    context.ipc = require("@/services/ipc");
    context.mailer = require("@/services/mailer");

    // Initialize all mocks
    context.database.getLatestPricing = jest.fn();
    context.database.insertPricing = jest.fn();
    context.ipc.fetchLatestIpc = jest.fn();
    context.mailer.sendEmailToRecipient = jest.fn();

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
    // Mock getLatestPricing to return existing pricing data
    context.database.getLatestPricing.mockResolvedValue({
      express_price: 100,
      experience_price: 200,
      deluxe_price: 300,
    });

    // Mock IPC fetching
    context.ipc.fetchLatestIpc.mockResolvedValue(3.5);

    // Mock insertPricing to return the new pricing
    context.database.insertPricing.mockResolvedValue({
      express_price: 103.5,
      experience_price: 207,
      deluxe_price: 310.5,
    });

    // Auth expects x-cron-secret header
    const request = new Request(
      "http://localhost/api/pricing/recalculate",
      {
        headers: {
          "x-cron-secret": "test-secret",
        },
      },
    );

    const response = await context.GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.express_price).toBe(103.5);
    expect(context.mailer.sendEmailToRecipient).toHaveBeenCalled();
  });

  it("should handle partial success", async () => {
    // Mock getLatestPricing to return existing pricing data
    context.database.getLatestPricing.mockResolvedValue({
      express_price: 100,
      experience_price: 200,
      deluxe_price: 300,
    });

    // Mock IPC fetching
    context.ipc.fetchLatestIpc.mockResolvedValue(2);

    // Mock insertPricing to return the new pricing
    context.database.insertPricing.mockResolvedValue({
      express_price: 102,
      experience_price: 204,
      deluxe_price: 306,
    });

    // Auth expects x-cron-secret header
    const request = new Request(
      "http://localhost/api/pricing/recalculate",
      {
        headers: {
          "x-cron-secret": "test-secret",
        },
      },
    );

    const response = await context.GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.express_price).toBe(102);
  });
});
