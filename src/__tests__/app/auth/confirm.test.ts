jest.mock("next/server", () => ({
  NextResponse: {
    redirect: (url: URL) => ({ status: 307, url: url.toString() }),
  },
}));

jest.mock("@/services/instagram/auth", () => ({
  createInstagramAuthClient: jest.fn(),
}));

import { GET } from "@/app/auth/confirm/route";
import { createInstagramAuthClient } from "@/services/instagram/auth";

const createRequest = (query: string) =>
  ({
    url: `https://boudoir.barcelona/auth/confirm?${query}`,
  }) as unknown as Request;

describe("Instagram auth confirmation", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("confirms an invited operator", async () => {
    const verifyOtp = jest.fn().mockResolvedValue({ error: null });
    jest.mocked(createInstagramAuthClient).mockResolvedValue({
      auth: { verifyOtp, exchangeCodeForSession: jest.fn() },
    } as never);

    const response = await GET(createRequest("token_hash=token&type=invite"));

    expect(response.url).toBe("https://boudoir.barcelona/instagram");
    expect(verifyOtp).toHaveBeenCalledWith({
      token_hash: "token",
      type: "invite",
    });
  });

  it("exchanges a PKCE confirmation code", async () => {
    const exchangeCodeForSession = jest.fn().mockResolvedValue({ error: null });
    jest.mocked(createInstagramAuthClient).mockResolvedValue({
      auth: { verifyOtp: jest.fn(), exchangeCodeForSession },
    } as never);

    const response = await GET(createRequest("code=confirmation-code"));

    expect(response.url).toBe("https://boudoir.barcelona/instagram");
    expect(exchangeCodeForSession).toHaveBeenCalledWith("confirmation-code");
  });

  it("logs the confirmation failure and returns a reference", async () => {
    const error = new Error("Token has expired or is invalid");
    jest.mocked(createInstagramAuthClient).mockResolvedValue({
      auth: {
        verifyOtp: jest.fn().mockResolvedValue({ error }),
        exchangeCodeForSession: jest.fn(),
      },
    } as never);
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    const response = await GET(createRequest("token_hash=token&type=email"));

    expect(response.url).toMatch(
      /^https:\/\/boudoir\.barcelona\/instagram\/login\?error=confirmation_failed&reference=/,
    );
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("instagram_auth_confirmation_failed"),
    );
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining(error.message),
    );
    consoleError.mockRestore();
  });

  it("logs a failed PKCE exchange", async () => {
    const error = new Error("Code has expired");
    jest.mocked(createInstagramAuthClient).mockResolvedValue({
      auth: {
        verifyOtp: jest.fn(),
        exchangeCodeForSession: jest.fn().mockResolvedValue({ error }),
      },
    } as never);
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    await GET(createRequest("code=confirmation-code"));

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("Code has expired"),
    );
    consoleError.mockRestore();
  });

  it("logs unsupported confirmation parameters", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    await GET(createRequest("state=unexpected"));

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("Unsupported confirmation parameters"),
    );
    consoleError.mockRestore();
  });
});
