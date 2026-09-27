jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    if (namespace === "professional_portfolio") {
      const messages =
        jest.requireActual<typeof import("@/messages/en.json")>(
          "@/messages/en.json",
        );
      return String(Reflect.get(messages.professional_portfolio, key));
    }
    return key;
  },
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
