jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, options?: { status?: number }) => ({
      status: options?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock("@/services/instagram/auth", () => ({
  getAuthenticatedOperator: jest.fn(),
}));

jest.mock("@/services/instagram/repository", () => ({
  getInstagramDatabase: jest.fn(),
  listInstagramConversations: jest.fn(),
}));

import { GET } from "@/app/api/instagram/conversations/route";
import { getAuthenticatedOperator } from "@/services/instagram/auth";
import {
  getInstagramDatabase,
  listInstagramConversations,
} from "@/services/instagram/repository";

describe("Instagram conversations API", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns a sign-in action when the operator session is missing", async () => {
    jest.mocked(getAuthenticatedOperator).mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      message:
        "Your admin session has expired. Sign in again to load the inbox.",
      requestId: expect.any(String),
    });
  });

  it("logs the infrastructure error and explains how to repair a missing schema", async () => {
    const error = {
      code: "PGRST205",
      message:
        "Could not find the table 'public.instagram_conversations' in the schema cache",
    };
    jest
      .mocked(getAuthenticatedOperator)
      .mockResolvedValue({ id: "operator" } as never);
    jest.mocked(getInstagramDatabase).mockReturnValue({} as never);
    jest.mocked(listInstagramConversations).mockRejectedValue(error);
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      message: "The Instagram inbox database is not ready.",
      requestId: expect.any(String),
      resolution: "Apply the Instagram Supabase migration, then retry.",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "instagram_conversations_load_failed",
      expect.objectContaining({
        requestId: body.requestId,
        error,
      }),
    );
    consoleError.mockRestore();
  });

  it("returns the conversations when the repository succeeds", async () => {
    const conversations = [{ id: "conversation-id" }];
    jest
      .mocked(getAuthenticatedOperator)
      .mockResolvedValue({ id: "operator" } as never);
    jest.mocked(getInstagramDatabase).mockReturnValue({} as never);
    jest
      .mocked(listInstagramConversations)
      .mockResolvedValue(conversations as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ conversations });
  });
});
