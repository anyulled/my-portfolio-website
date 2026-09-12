import InstagramInbox from "@/app/instagram/InstagramInbox";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

describe("InstagramInbox", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows an actionable OAuth connection error reference", () => {
    render(
      <InstagramInbox connectionError={{ reference: "oauth-reference" }} />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to connect the Instagram account.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Reference: oauth-reference",
    );
  });

  it("shows the server diagnosis and reference without claiming the inbox is empty", async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        message: "The Instagram inbox database is not ready.",
        requestId: "request-id",
        resolution: "Apply the Instagram Supabase migration, then retry.",
      }),
    } as Response);

    render(<InstagramInbox />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "The Instagram inbox database is not ready.",
      ),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Apply the Instagram Supabase migration, then retry.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Reference: request-id",
    );
    expect(
      screen.queryByText("No conversations need attention."),
    ).not.toBeInTheDocument();
  });

  it("recovers after retrying a transient load failure", async () => {
    jest
      .mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          message: "The inbox is temporarily unavailable.",
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ conversations: [] }),
      } as Response);

    render(<InstagramInbox />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "The inbox is temporarily unavailable.",
      ),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Retry loading conversations" }),
    );

    await waitFor(() =>
      expect(
        screen.getByText("No conversations need attention."),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
