jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, options?: { status?: number }) => ({
      status: options?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock("@/services/instagram/auth", () => ({
  createInstagramAuthClient: jest.fn(),
}));

import { POST } from "@/app/api/instagram/login/route";
import { createInstagramAuthClient } from "@/services/instagram/auth";

const createRequest = (body: unknown) =>
  ({
    url: "https://boudoir.barcelona/api/instagram/login",
    json: async () => body,
  }) as unknown as Request;

describe("Instagram login API", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns a request reference and logs Supabase errors", async () => {
    const error = new Error("Email provider is not configured");
    jest.mocked(createInstagramAuthClient).mockResolvedValue({
      auth: { signInWithOtp: jest.fn().mockResolvedValue({ error }) },
    } as never);
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    const response = await POST(createRequest({ email: "anyulled@gmail.com" }));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.message).toBe("Unable to send the access link.");
    expect(body.requestId).toEqual(expect.any(String));
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("instagram_magic_link_failed"),
    );
    consoleError.mockRestore();
  });

  it("sends the link through the server-side auth client", async () => {
    const signInWithOtp = jest.fn().mockResolvedValue({ error: null });
    jest.mocked(createInstagramAuthClient).mockResolvedValue({
      auth: { signInWithOtp },
    } as never);

    const response = await POST(createRequest({ email: "anyulled@gmail.com" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("Check your email for the access link.");
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "anyulled@gmail.com",
      options: {
        shouldCreateUser: false,
        emailRedirectTo: "https://boudoir.barcelona/auth/confirm",
      },
    });
  });
});
