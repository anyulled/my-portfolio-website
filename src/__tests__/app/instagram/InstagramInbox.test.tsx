import InstagramInbox from "@/app/instagram/InstagramInbox";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const pendingConversation = {
  id: "conversation-id",
  accountHandle: "anyulled",
  participantId: "participant-id",
  participantUsername: "model-account",
  participantName: "Model Name",
  participantBiography: "Barcelona model",
  participantFollowersCount: 1234,
  participantProfilePictureUrl: "https://example.com/profile.jpg",
  lastMessage: "I am a model visiting Barcelona.",
  detectedLanguage: "en",
  classification: "manual_review",
  confidence: 0.9,
  processingState: "pending",
  responseRoute: null,
  responseSentAt: null,
  lastError: null,
};

const mockPendingConversationLoad = () => {
  jest.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ conversations: [pendingConversation] }),
  } as Response);
};

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

  it("shows the participant profile details in the conversation card", async () => {
    mockPendingConversationLoad();

    render(<InstagramInbox />);

    await waitFor(() =>
      expect(screen.getByText("@model-account")).toBeInTheDocument(),
    );
    expect(screen.getByText("Model Name")).toBeInTheDocument();
    expect(screen.getByText("Barcelona model")).toBeInTheDocument();
    expect(screen.getByText("1,234 followers")).toBeInTheDocument();
    expect(screen.getByLabelText("Participant profile photo")).toHaveStyle({
      backgroundImage: "url(https://example.com/profile.jpg)",
    });
  });

  it("falls back to the participant ID when profile metadata is absent", async () => {
    jest.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        conversations: [
          {
            ...pendingConversation,
            participantUsername: null,
            participantName: null,
            participantBiography: null,
            participantFollowersCount: null,
            participantProfilePictureUrl: null,
          },
        ],
      }),
    } as Response);

    render(<InstagramInbox />);

    await waitFor(() =>
      expect(screen.getByText("@participant-id")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Model Name")).not.toBeInTheDocument();
    expect(screen.queryByText("Barcelona model")).not.toBeInTheDocument();
    expect(screen.queryByText("1,234 followers")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Participant profile photo"),
    ).not.toBeInTheDocument();
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

  it("shows the connected accounts instead of connection buttons", async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ conversations: [] }),
    } as Response);

    render(
      <InstagramInbox connectedAccounts={["anyulled", "sensuelleboudoir"]} />,
    );

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Connected Instagram accounts: @anyulled, @sensuelleboudoir",
      ),
    );
    expect(
      screen.queryByRole("link", { name: "Connect @anyulled" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Connect @sensuelleboudoir" }),
    ).not.toBeInTheDocument();
  });

  it("keeps a connection button for an account that is not connected", async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ conversations: [] }),
    } as Response);

    render(<InstagramInbox connectedAccounts={["anyulled"]} />);

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Connected Instagram accounts: @anyulled",
      ),
    );
    expect(
      screen.queryByRole("link", { name: "Connect @anyulled" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Connect @sensuelleboudoir" }),
    ).toHaveAttribute(
      "href",
      "/api/instagram/oauth/start?account=sensuelleboudoir",
    );
  });

  it("shows the server diagnosis when applying a decision fails", async () => {
    mockPendingConversationLoad();
    jest.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({
        message: "Unable to deliver the Instagram response.",
        requestId: "decision-request-id",
        resolution:
          "Retry the decision. If delivery still fails, check the connected Instagram account and Meta messaging permission.",
      }),
    } as Response);

    render(<InstagramInbox />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Send model form" }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Send model form" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Unable to deliver the Instagram response.",
      ),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Retry the decision.");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Reference: decision-request-id",
    );
    expect(
      screen.getByText("I am a model visiting Barcelona."),
    ).toBeInTheDocument();
  });

  it("keeps the conversation when the decision request cannot reach the server", async () => {
    mockPendingConversationLoad();
    jest
      .mocked(global.fetch)
      .mockRejectedValueOnce(new Error("network unavailable"));

    render(<InstagramInbox />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Send model form" }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Send model form" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Unable to reach the Instagram inbox.",
      ),
    );
    expect(
      screen.getByText("I am a model visiting Barcelona."),
    ).toBeInTheDocument();
  });

  it("clears a previous decision error after a successful retry", async () => {
    mockPendingConversationLoad();
    jest
      .mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => ({
          message: "Unable to deliver the Instagram response.",
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ conversation: pendingConversation }),
      } as Response);

    render(<InstagramInbox />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Send model form" }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Send model form" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Unable to deliver the Instagram response.",
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Send model form" }));

    await waitFor(() =>
      expect(
        screen.getByText("No conversations need attention."),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
