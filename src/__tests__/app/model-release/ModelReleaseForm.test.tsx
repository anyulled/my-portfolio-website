import { ModelReleaseForm } from "@/app/model-release/components/ModelReleaseForm";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const canvasContext = {
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  clearRect: jest.fn(),
};

describe("ModelReleaseForm", () => {
  beforeEach(() => {
    jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation(
        () => canvasContext as unknown as CanvasRenderingContext2D,
      );
    jest
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue("data:image/png;base64,signature");
    HTMLCanvasElement.prototype.setPointerCapture = jest.fn();
    HTMLCanvasElement.prototype.releasePointerCapture = jest.fn();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders model-owned fields and fixed release details", () => {
    render(<ModelReleaseForm releaseDate="2026-08-31" />);

    expect(
      screen.getByRole("heading", { name: "model_information" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("full_name *")).toBeInTheDocument();
    expect(screen.getByLabelText("gender (optional)")).toBeInTheDocument();
    expect(screen.getAllByText("Anyul Led Rivas Oropeza")).toHaveLength(2);
    expect(screen.getByText("Barcelona, Spain")).toBeInTheDocument();
    expect(document.querySelector("#model-signature")).toBeInTheDocument();
  });

  it("requires model identity and signature before submitting", async () => {
    render(<ModelReleaseForm releaseDate="2026-08-31" />);

    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("submits the completed model release and shows confirmation", async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: "sent" }),
    } as Response);
    render(<ModelReleaseForm releaseDate="2026-08-31" />);

    fireEvent.change(screen.getByLabelText("full_name *"), {
      target: { value: "Test Model" },
    });
    fireEvent.change(screen.getByLabelText("birth_date *"), {
      target: { value: "1990-01-01" },
    });
    fireEvent.change(screen.getByLabelText("document_number *"), {
      target: { value: "X1234567" },
    });
    fireEvent.change(screen.getByLabelText("email *"), {
      target: { value: "model@example.com" },
    });
    fireEvent.change(screen.getByLabelText("phone *"), {
      target: { value: "+34 600 123 456" },
    });
    fireEvent.pointerDown(
      document.querySelector("#model-signature") as HTMLCanvasElement,
      {
        clientX: 20,
        clientY: 20,
        pointerId: 1,
      },
    );
    fireEvent.pointerUp(
      document.querySelector("#model-signature") as HTMLCanvasElement,
      {
        pointerId: 1,
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "success_title" }),
      ).toBeInTheDocument(),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/model-release",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows the server error when delivery fails", async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, message: "server_error" }),
    } as Response);
    render(<ModelReleaseForm releaseDate="2026-08-31" />);

    fireEvent.change(screen.getByLabelText("full_name *"), {
      target: { value: "Test Model" },
    });
    fireEvent.change(screen.getByLabelText("birth_date *"), {
      target: { value: "1990-01-01" },
    });
    fireEvent.change(screen.getByLabelText("document_number *"), {
      target: { value: "X1234567" },
    });
    fireEvent.change(screen.getByLabelText("email *"), {
      target: { value: "model@example.com" },
    });
    fireEvent.change(screen.getByLabelText("phone *"), {
      target: { value: "+34 600 123 456" },
    });
    fireEvent.pointerDown(
      document.querySelector("#model-signature") as HTMLCanvasElement,
      {
        clientX: 20,
        clientY: 20,
        pointerId: 1,
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("server_error"),
    );
  });
});
