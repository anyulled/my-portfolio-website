import ModelReleasePage from "@/app/model-release/page";
import { render, screen } from "@testing-library/react";

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

describe("ModelReleasePage", () => {
  beforeEach(() => {
    jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation(() => ({}) as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the model release heading and form", () => {
    render(ModelReleasePage());

    expect(screen.getByRole("heading", { name: "title" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "submit" })).toBeInTheDocument();
  });
});
