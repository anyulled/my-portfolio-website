jest.mock("react", () => ({
  ...jest.requireActual("react"),
  cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

jest.mock("@/services/database", () => ({
  getLatestPricing: jest.fn(),
}));

import { getPricing } from "@/lib/pricing";
import { getLatestPricing } from "@/services/database";

describe("pricing lib", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the latest pricing record", async () => {
    const record = {
      id: "pricing-1",
      inserted_at: "2024-05-26T12:00:00.000Z",
      express_price: 200,
      experience_price: 350,
      deluxe_price: 600,
    };

    (getLatestPricing as jest.Mock).mockResolvedValue(record);

    const result = await getPricing();

    expect(getLatestPricing).toHaveBeenCalledTimes(1);
    expect(result).toEqual(record);
  });

  it("returns null when no pricing data is available", async () => {
    (getLatestPricing as jest.Mock).mockResolvedValue(null);

    const result = await getPricing();

    expect(getLatestPricing).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });
});
