jest.mock("@/lib/pricing", () => ({ getPricing: jest.fn() }));
jest.mock("next/server", () => ({
  connection: jest.fn(async () => undefined),
  NextResponse: {
    json: (body: unknown) => ({ json: async () => body }),
  },
}));

import { GET } from "@/app/api/assistant-information/route";
import { getPricing } from "@/lib/pricing";
import { connection } from "next/server";

const mockedGetPricing = jest.mocked(getPricing);

describe("assistant information", () => {
  beforeEach(() => mockedGetPricing.mockReset());

  it("returns current public prices and the enquiry limitation", async () => {
    mockedGetPricing.mockResolvedValue({
      id: "current",
      express_price: 225,
      experience_price: 375,
      deluxe_price: 625,
    } as Awaited<ReturnType<typeof getPricing>>);

    const response = await GET();
    const body = await response.json();

    expect(body.packages.map((item: { price: number }) => item.price)).toEqual([
      225, 375, 625,
    ]);
    expect(body.photographer.name).toBe("Anyul Rivas");
    expect(connection).toHaveBeenCalled();
    expect(body.enquiry.confirmation).toContain("does not confirm");
  });

  it("does not invent prices when no current record exists", async () => {
    mockedGetPricing.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(body.packages.map((item: { price: number }) => item.price)).toEqual([
      null,
      null,
      null,
    ]);
  });
});
