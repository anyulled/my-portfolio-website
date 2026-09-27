jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

import Footer from "@/components/Footer";
import { render, screen } from "@testing-library/react";

describe("footer discovery links", () => {
  it("links the portfolio service and supplied Google review page", () => {
    render(<Footer />);

    expect(
      screen.getByRole("link", {
        name: "Professional portfolio photography in Barcelona",
      }),
    ).toHaveAttribute("href", "/professional-portfolio-photography");
    expect(
      screen.getByRole("link", {
        name: "Review Sensuelle Boudoir on Google",
      }),
    ).toHaveAttribute("href", "https://g.page/r/CXYGEWUyinIwEBM/review");
  });
});
