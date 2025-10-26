import { GET } from "@/app/api/pricing/recalculate/route";
import { getLatestPricing, insertPricing } from "@/services/database";
import { fetchLatestIpc } from "@/services/ipc";

jest.mock("chalk", () => ({
  __esModule: true,
  default: {
    gray: jest.fn((message: string) => message),
    yellow: jest.fn((message: string) => message),
    red: jest.fn((message: string) => message),
  },
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: () => Promise.resolve(body),
    })),
  },
}));

jest.mock("@/services/database", () => ({
  getLatestPricing: jest.fn(),
  insertPricing: jest.fn(),
}));

jest.mock("@/services/ipc", () => ({
  fetchLatestIpc: jest.fn(),
}));

function createRequest(
  url: string,
  init?: { headers?: Record<string, string> },
): Request {
  const headerEntries = Object.entries(init?.headers ?? {}).map(([key, value]) => [
    key.toLowerCase(),
    value,
  ]);

  const headerMap = new Map(headerEntries);

  return {
    url,
    headers: {
      has: (name: string) => headerMap.has(name.toLowerCase()),
      get: (name: string) => headerMap.get(name.toLowerCase()) ?? null,
    },
  } as unknown as Request;
}

describe("GET /api/pricing/recalculate", () => {
  const mockGetLatestPricing = jest.mocked(getLatestPricing);
  const mockInsertPricing = jest.mocked(insertPricing);
  const mockFetchLatestIpc = jest.mocked(fetchLatestIpc);
  const originalSecret = process.env.PRICING_RECALC_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.PRICING_RECALC_SECRET;
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.PRICING_RECALC_SECRET;
    } else {
      process.env.PRICING_RECALC_SECRET = originalSecret;
    }
  });

  it("rejects manual invocations when the secret is not configured", async () => {
    const request = createRequest("https://example.com/api/pricing/recalculate");

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toEqual({
      success: false,
      error: "Manual recalculation is disabled. Configure PRICING_RECALC_SECRET to enable it.",
    });
  });

  it("rejects manual invocations with an invalid token", async () => {
    process.env.PRICING_RECALC_SECRET = "top-secret";

    const request = createRequest(
      "https://example.com/api/pricing/recalculate?token=wrong",
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns 404 when no pricing data is available", async () => {
    process.env.PRICING_RECALC_SECRET = "top-secret";
    mockGetLatestPricing.mockResolvedValue(null);

    const request = createRequest(
      "https://example.com/api/pricing/recalculate?token=top-secret",
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload).toEqual({
      success: false,
      error: "No pricing data available to recalculate.",
    });
  });

  it("recalculates pricing and persists the result when authorized", async () => {
    process.env.PRICING_RECALC_SECRET = "top-secret";

    mockGetLatestPricing.mockResolvedValue({
      express_price: 100,
      experience_price: 200,
      deluxe_price: 300,
    });

    mockFetchLatestIpc.mockResolvedValue(5);

    const insertedRecord = {
      id: "pricing-123",
      inserted_at: "2024-01-01T00:00:00.000Z",
      express_price: 105,
      experience_price: 210,
      deluxe_price: 315,
    };

    mockInsertPricing.mockResolvedValue(insertedRecord as never);

    const request = createRequest(
      "https://example.com/api/pricing/recalculate?token=top-secret",
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(mockInsertPricing).toHaveBeenCalledWith({
      express_price: 105,
      experience_price: 210,
      deluxe_price: 315,
    });

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      success: true,
      data: insertedRecord,
      meta: expect.objectContaining({
        ipcPercentage: 5,
        adjustmentFactor: 1.05,
        triggeredBy: "manual",
      }),
    });
  });

  it("returns 500 when the recalculated pricing cannot be persisted", async () => {
    process.env.PRICING_RECALC_SECRET = "top-secret";

    mockGetLatestPricing.mockResolvedValue({
      express_price: 100,
      experience_price: 200,
      deluxe_price: 300,
    });

    mockFetchLatestIpc.mockResolvedValue(2);
    mockInsertPricing.mockResolvedValue(null);

    const request = createRequest(
      "https://example.com/api/pricing/recalculate?token=top-secret",
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      success: false,
      error: "Failed to recalculate pricing. Check server logs for details.",
    });
  });

  it("validates cron invocations against the configured secret when provided", async () => {
    process.env.PRICING_RECALC_SECRET = "top-secret";

    const request = createRequest("https://example.com/api/pricing/recalculate", {
      headers: {
        "x-vercel-cron": "1",
        "x-cron-secret": "invalid",
      },
    });

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ success: false, error: "Unauthorized" });
  });
});
