import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginForm from "@/app/instagram/login/LoginForm";

describe("Instagram LoginForm redirect context", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("shows an initial message and sends the selected return route", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Access link sent." }),
    });
    render(
      <LoginForm
        initialMessage="Check your inbox"
        redirectTo="/admin/portfolio"
      />,
    );
    expect(screen.getByText("Check your inbox")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Your authorized email"), {
      target: { value: "operator@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send access link" }));
    await waitFor(() =>
      expect(screen.getByText("Access link sent.")).toBeInTheDocument(),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/instagram/login",
      expect.objectContaining({
        body: JSON.stringify({
          email: "operator@example.com",
          redirectTo: "/admin/portfolio",
        }),
      }),
    );
  });

  it("shows API references on errors and a fallback when the request throws", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Denied", requestId: "request-1" }),
      })
      .mockRejectedValueOnce(new Error("network error"));
    render(<LoginForm />);
    const email = screen.getByPlaceholderText("Your authorized email");
    fireEvent.change(email, { target: { value: "operator@example.com" } });
    fireEvent.submit(email.closest("form")!);
    await waitFor(() =>
      expect(
        screen.getByText("Denied Reference: request-1"),
      ).toBeInTheDocument(),
    );
    fireEvent.submit(email.closest("form")!);
    await waitFor(() =>
      expect(
        screen.getByText("Unable to send the access link."),
      ).toBeInTheDocument(),
    );
  });
});
