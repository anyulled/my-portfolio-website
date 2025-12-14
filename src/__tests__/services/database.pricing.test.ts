import {
  getLatestPricing,
  insertPricing,
  PricingPackageInsert,
} from "@/services/database";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

jest.mock("chalk", () => ({
  __esModule: true,
  default: {
    gray: jest.fn((message: string) => message),
    green: jest.fn((message: string) => message),
    yellow: jest.fn((message: string) => message),
    red: jest.fn((message: string) => message),
  },
}));

describe("pricing database helpers", () => {
  const mockCookieStore = {
    getAll: jest.fn(() => []),
    set: jest.fn(),
  } as unknown as Awaited<ReturnType<typeof cookies>>;

  beforeEach(() => {
    jest.clearAllMocks();
    (cookies as jest.Mock).mockResolvedValue(mockCookieStore);
  });

  describe("getLatestPricing", () => {
    it("returns the most recent pricing record when available", async () => {
      const record = {
        id: "pricing-1",
        inserted_at: "2024-05-26T12:00:00.000Z",
        express_price: 199,
        experience_price: 349,
        deluxe_price: 599,
      };

      const mockMaybeSingle = jest
        .fn()
        .mockResolvedValue({ data: record, error: null });
      const mockLimit = jest
        .fn()
        .mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      (createServerClient as jest.Mock).mockReturnValue({
        from: mockFrom,
      });

      const result = await getLatestPricing();

      expect(cookies).toHaveBeenCalledTimes(1);
      expect(createServerClient).toHaveBeenCalledTimes(1);
      expect(mockFrom).toHaveBeenCalledWith("pricing_packages");
      expect(mockSelect).toHaveBeenCalledWith(
        "id, inserted_at, express_price, experience_price, deluxe_price",
      );
      expect(mockOrder).toHaveBeenCalledWith("inserted_at", {
        ascending: false,
      });
      expect(mockLimit).toHaveBeenCalledWith(1);
      expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
      expect(result).toEqual(record);
    });

    it("returns null when Supabase reports an error", async () => {
      const mockMaybeSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: "failure" } });
      const mockLimit = jest
        .fn()
        .mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      (createServerClient as jest.Mock).mockReturnValue({
        from: mockFrom,
      });

      const result = await getLatestPricing();

      expect(result).toBeNull();
    });

    it("returns null when no pricing record is found", async () => {
      const mockMaybeSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: null });
      const mockLimit = jest
        .fn()
        .mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      (createServerClient as jest.Mock).mockReturnValue({
        from: mockFrom,
      });

      const result = await getLatestPricing();

      expect(result).toBeNull();
    });
  });

  describe("insertPricing", () => {
    it("persists pricing values and returns the inserted record", async () => {
      const input: PricingPackageInsert = {
        express_price: 205,
        experience_price: 355,
        deluxe_price: 605,
      };

      const insertedRecord = {
        id: "pricing-2",
        inserted_at: "2024-05-27T10:00:00.000Z",
        express_price: input.express_price,
        experience_price: input.experience_price,
        deluxe_price: input.deluxe_price,
      };

      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: insertedRecord, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });

      (createServerClient as jest.Mock).mockReturnValue({
        from: mockFrom,
      });

      const result = await insertPricing(input);

      expect(mockFrom).toHaveBeenCalledWith("pricing_packages");
      expect(mockInsert).toHaveBeenCalledWith({
        express_price: input.express_price,
        experience_price: input.experience_price,
        deluxe_price: input.deluxe_price,
      });
      expect(mockSelect).toHaveBeenCalledWith(
        "id, inserted_at, express_price, experience_price, deluxe_price",
      );
      expect(mockSingle).toHaveBeenCalledTimes(1);
      expect(result).toEqual(insertedRecord);
    });

    it("returns null when insert fails", async () => {
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: "insert error" } });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });

      (createServerClient as jest.Mock).mockReturnValue({
        from: mockFrom,
      });

      const result = await insertPricing({
        express_price: null,
        experience_price: null,
        deluxe_price: null,
      });

      expect(result).toBeNull();
    });
  });
});
