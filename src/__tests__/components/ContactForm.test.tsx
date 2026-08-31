import ContactForm from "@/components/ContactForm";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("next/font/google", () => ({
  Aref_Ruqaa: () => ({ className: "mock-aref-ruqaa" }),
}));

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

jest.mock("@/components/FadeInTitle", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/hooks/eventTracker", () => ({
  __esModule: true,
  default: () => jest.fn(),
}));

jest.mock("@/lib/gtag", () => ({
  submitLeadForm: jest.fn(),
}));

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
}));

const validMessage = Array.from(
  { length: 40 },
  (_, index) =>
    `This is a meaningful contact message sentence number ${index}.`,
).join(" ");

const fillContactFields = (message = validMessage) => {
  fireEvent.change(screen.getByLabelText("name"), {
    target: { value: "Test User" },
  });
  fireEvent.change(screen.getByLabelText("email"), {
    target: { value: "test@example.com" },
  });
  fireEvent.change(screen.getByLabelText("message"), {
    target: { value: message },
  });
};

describe("ContactForm", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("communicates the message requirements to the browser", () => {
    render(<ContactForm />);

    const messageField = screen.getByLabelText("message");
    expect(messageField).toHaveAttribute("minlength", "200");
    expect(screen.getByText("message_hint")).toBeInTheDocument();
  });

  it("shows a translated error and does not submit a short message", async () => {
    render(<ContactForm />);
    fillContactFields("A short message with spaces");

    fireEvent.click(screen.getByRole("button", { name: "send_message" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "error_message_min_length",
      ),
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects a long message without spaces", async () => {
    render(<ContactForm />);
    fillContactFields("a".repeat(200));

    fireEvent.click(screen.getByRole("button", { name: "send_message" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "error_message_spaces",
      ),
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("submits a valid message and resets the form after confirmation", async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: "sent" }),
    } as Response);
    render(<ContactForm />);
    fillContactFields();

    fireEvent.click(screen.getByRole("button", { name: "send_message" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.getByLabelText("name")).toHaveValue("");
    expect(screen.getByLabelText("email")).toHaveValue("");
    expect(screen.getByLabelText("message")).toHaveValue("");
  });

  it("shows the server-provided delivery error", async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, message: "server_error" }),
    } as Response);
    render(<ContactForm />);
    fillContactFields();

    fireEvent.click(screen.getByRole("button", { name: "send_message" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("server_error"),
    );
  });
});
