import InstagramPage from "@/app/instagram/page";
import { getAuthenticatedOperator } from "@/services/instagram/auth";
import {
  getInstagramDatabase,
  listConnectedInstagramAccounts,
} from "@/services/instagram/repository";
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("@/services/instagram/auth", () => ({
  getAuthenticatedOperator: jest.fn(),
}));

jest.mock("@/services/instagram/repository", () => ({
  getInstagramDatabase: jest.fn(),
  listConnectedInstagramAccounts: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("InstagramPage", () => {
  beforeEach(() => {
    jest.mocked(getAuthenticatedOperator).mockResolvedValue({
      id: "operator",
    } as never);
    jest.mocked(getInstagramDatabase).mockReturnValue({} as never);
    jest
      .mocked(listConnectedInstagramAccounts)
      .mockResolvedValue(["anyulled", "sensuelleboudoir"]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ conversations: [] }),
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("passes connected account handles to the inbox", async () => {
    const page = await InstagramPage({
      searchParams: Promise.resolve({}),
    });

    render(page);

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Connected Instagram accounts: @anyulled, @sensuelleboudoir",
      ),
    );
    expect(listConnectedInstagramAccounts).toHaveBeenCalledWith({});
  });
});
