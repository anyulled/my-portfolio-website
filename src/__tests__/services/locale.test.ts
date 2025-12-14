import { getUserLocale, setUserLocale } from "@/services/locale";
import { cookies, headers } from "next/headers";
import { defaultLocale } from "@/i18n/config";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
  headers: jest.fn(),
}));

jest.mock("@/i18n/config", () => ({
  defaultLocale: "en",
  locales: ["en", "es", "fr"],
  Locale: {
    EN: "en",
    ES: "es",
    FR: "fr",
  },
}));

describe("Locale Service", () => {
  const mockCookies = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockHeaders = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (cookies as jest.Mock).mockReturnValue(mockCookies);
    (headers as jest.Mock).mockResolvedValue(mockHeaders);
  });

  describe("getUserLocale", () => {
    it("should return locale from cookies if available", async () => {
      mockCookies.get.mockReturnValue({ value: "fr" });

      const result = await getUserLocale();

      expect(cookies).toHaveBeenCalled();
      expect(mockCookies.get).toHaveBeenCalledWith("NEXT_LOCALE");
      expect(result).toBe("fr");
    });

    it("should return locale from headers if cookie not available", async () => {
      mockCookies.get.mockReturnValue(undefined);

      mockHeaders.get.mockReturnValue("en-US,es;q=0.9");

      const result = await getUserLocale();

      expect(cookies).toHaveBeenCalled();
      expect(mockCookies.get).toHaveBeenCalledWith("NEXT_LOCALE");
      expect(headers).toHaveBeenCalled();
      expect(mockHeaders.get).toHaveBeenCalledWith("accept-language");
      expect(result).toBe("es");
    });

    it("should return default locale if neither cookie nor header is available", async () => {
      mockCookies.get.mockReturnValue(undefined);

      mockHeaders.get.mockReturnValue(undefined);

      const result = await getUserLocale();

      expect(cookies).toHaveBeenCalled();
      expect(mockCookies.get).toHaveBeenCalledWith("NEXT_LOCALE");
      expect(headers).toHaveBeenCalled();
      expect(mockHeaders.get).toHaveBeenCalledWith("accept-language");
      expect(result).toBe(defaultLocale);
    });
  });

  describe("setUserLocale", () => {
    it("should set locale in cookies", async () => {
      await setUserLocale("es");

      expect(cookies).toHaveBeenCalled();
      expect(mockCookies.set).toHaveBeenCalledWith("NEXT_LOCALE", "es");
    });
  });
});
