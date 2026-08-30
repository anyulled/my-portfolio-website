import { PhotographyReleaseForm } from "@/app/photography-release/components/PhotographyReleaseForm";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const renderForm = () =>
  render(<PhotographyReleaseForm sessionDate="2026-08-31" />);

describe("PhotographyReleaseForm", () => {
  beforeEach(() => {
    jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () =>
        ({
          lineWidth: 0,
          lineCap: "round",
          lineJoin: "round",
          strokeStyle: "",
          beginPath: jest.fn(),
          moveTo: jest.fn(),
          lineTo: jest.fn(),
          stroke: jest.fn(),
          clearRect: jest.fn(),
        }) as unknown as CanvasRenderingContext2D,
    );
    jest
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue("data:image/png;base64,signature");
    HTMLCanvasElement.prototype.setPointerCapture = jest.fn();
    HTMLCanvasElement.prototype.releasePointerCapture = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the release fields and keeps privacy controls disabled by default", () => {
    renderForm();

    expect(
      screen.getByRole("heading", { name: "client_information" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("full_name *")).toBeInTheDocument();
    expect(screen.getByLabelText("birth_date *")).toBeInTheDocument();
    expect(screen.getByLabelText("document_number *")).toBeInTheDocument();
    expect(screen.getByLabelText("email *")).toBeInTheDocument();
    expect(screen.getByLabelText("phone *")).toBeInTheDocument();
    expect(screen.getByRole("group")).toBeDisabled();
  });

  it("enables privacy selection after an image permission is selected", async () => {
    renderForm();
    const usageCheckboxes = screen.getAllByRole("checkbox");

    fireEvent.click(usageCheckboxes[0]);

    await waitFor(() => expect(screen.getByRole("group")).not.toBeDisabled());
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });
});
