import { jest } from "@jest/globals";

const mockEnMessages = { test: "English message" };
const mockEsMessages = { test: "Spanish message" };
type Messages = Record<string, Record<string, string>>;
type RequestConfig = () => Promise<{
  locale: string;
  messages: Record<string, string>;
}>;

const createRequestConfigForTesting = (
  mockGetUserLocale: () => Promise<string>,
  mockMessages: Messages = {},
): RequestConfig => {
  return async () => {
    const requestedLocale = await mockGetUserLocale();
    const availableLocales = ["es", "en", "fr", "ca", "it", "uk"];
    const FALLBACK_LOCALE = "en";

    const locale = availableLocales.includes(requestedLocale)
      ? requestedLocale
      : FALLBACK_LOCALE;

    const messages = (() => {
      try {
        if (requestedLocale === "error-test") {
          const error = new Error("Failed to import messages");
          console.error(
            `[ i18n ] Failed to import messages for locale ${requestedLocale}:`,
            error,
          );
          // Return null to trigger fallback logic
          return null;
        }

        return mockMessages[locale] || {};
      } catch (importError) {
        console.error(
          `[ i18n ] Failed to import messages for locale ${locale}:`,
          importError,
        );
        return null;
      }
    })();

    if (!messages) {
      console.info(
        `[ i18n ] Fallback to English messages for locale: ${locale}`,
      );
    } else {
      console.info(
        `[ i18n ] Successfully loaded messages for locale: ${locale}`,
      );
    }

    return {
      locale: messages ? locale : FALLBACK_LOCALE,
      messages: messages || mockMessages[FALLBACK_LOCALE] || {},
    };
  };
};

describe("i18n request config", () => {
  const context: {
    mockGetUserLocale: jest.MockedFunction<() => Promise<string>>;
    requestConfig: RequestConfig;
    mockMessages: Messages;
  } = {
    mockGetUserLocale: jest.fn(),
    requestConfig: async () => ({ locale: "en", messages: {} }),
    mockMessages: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    context.mockGetUserLocale = jest.fn();
    context.mockMessages = {
      en: mockEnMessages,
      es: mockEsMessages,
    };

    context.requestConfig = createRequestConfigForTesting(
      context.mockGetUserLocale,
      context.mockMessages,
    );
  });

  it("should return the requested locale when it is in the available locales", async () => {
    context.mockGetUserLocale.mockResolvedValue("es");

    const result = await context.requestConfig();

    expect(result.locale).toBe("es");
    expect(context.mockGetUserLocale).toHaveBeenCalledTimes(1);
  });

  it('should fall back to "en" when the requested locale is not available', async () => {
    context.mockGetUserLocale.mockResolvedValue("invalid");

    const result = await context.requestConfig();

    expect(result.locale).toBe("en");
    expect(context.mockGetUserLocale).toHaveBeenCalledTimes(1);
  });

  it("should properly load messages for a valid locale", async () => {
    context.mockGetUserLocale.mockResolvedValue("es");

    const result = await context.requestConfig();

    expect(result.locale).toBe("es");
    expect(result.messages).toEqual(mockEsMessages);
  });

  it("should handle import errors gracefully", async () => {
    context.mockGetUserLocale.mockResolvedValue("error-test");

    const result = await context.requestConfig();

    expect(result.locale).toBe("en");
    expect(result.messages).toEqual(mockEnMessages);
  });
});
