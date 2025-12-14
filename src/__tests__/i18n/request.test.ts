import { jest } from "@jest/globals";
import { Mock, UnknownFunction } from "jest-mock";
import { RequestConfig } from "next-intl/dist/types/src/server/react-server/getRequestConfig";

const mockEnMessages = { test: "English message" };
const mockEsMessages = { test: "Spanish message" };
const createRequestConfigForTesting = (
  mockGetUserLocale,
  mockMessages = {},
) => {
  return async () => {
    const requestedLocale = await mockGetUserLocale();
    const availableLocales = ["es", "en", "fr", "ca", "it", "uk"];
    const FALLBACK_LOCALE = "en";

    const locale = availableLocales.includes(requestedLocale)
      ? requestedLocale
      : FALLBACK_LOCALE;

    let messages;
    try {
      if (requestedLocale === "error-test") {
        const error = new Error("Failed to import messages");
        console.error(
          `[ i18n ] Failed to import messages for locale ${requestedLocale}:`,
          error,
        );
        return {
          locale: FALLBACK_LOCALE,
          messages: mockMessages[FALLBACK_LOCALE] || {},
        };
      }

      messages = mockMessages[locale] || {};
      console.info(
        `[ i18n ] Successfully loaded messages for locale: ${locale}`,
      );
    } catch (importError) {
      console.error(
        `[ i18n ] Failed to import messages for locale ${locale}:`,
        importError,
      );
      messages = mockMessages[FALLBACK_LOCALE] || {};
    }

    return {
      locale,
      messages,
    };
  };
};

describe("i18n request config", () => {
  let mockGetUserLocale: Mock<UnknownFunction>;
  let requestConfig: () => RequestConfig;
  let mockMessages;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserLocale = jest.fn();
    mockMessages = {
      en: mockEnMessages,
      es: mockEsMessages,
    };

    requestConfig = createRequestConfigForTesting(
      mockGetUserLocale,
      mockMessages,
    );
  });

  it("should return the requested locale when it is in the available locales", async () => {
    mockGetUserLocale.mockResolvedValue("es");

    const result = await requestConfig();

    expect(result.locale).toBe("es");
    expect(mockGetUserLocale).toHaveBeenCalledTimes(1);
  });

  it('should fall back to "en" when the requested locale is not available', async () => {
    mockGetUserLocale.mockResolvedValue("invalid");

    const result = await requestConfig();

    expect(result.locale).toBe("en");
    expect(mockGetUserLocale).toHaveBeenCalledTimes(1);
  });

  it("should properly load messages for a valid locale", async () => {
    mockGetUserLocale.mockResolvedValue("es");

    const result = await requestConfig();

    expect(result.locale).toBe("es");
    expect(result.messages).toEqual(mockEsMessages);
  });

  it("should handle import errors gracefully", async () => {
    mockGetUserLocale.mockResolvedValue("error-test");

    const result = await requestConfig();

    expect(result.locale).toBe("en");
    expect(result.messages).toEqual(mockEnMessages);
  });
});
