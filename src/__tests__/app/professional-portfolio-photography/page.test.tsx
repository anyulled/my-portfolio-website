jest.mock("next-intl/server", () => ({ getLocale: jest.fn() }));
jest.mock("@/app/professional-portfolio-photography/EnquiryButton", () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => <button>{label}</button>,
}));

import ProfessionalPortfolioPage, {
  generateMetadata,
} from "@/app/professional-portfolio-photography/page";
import { render, screen } from "@testing-library/react";
import { getLocale } from "next-intl/server";

const mockedGetLocale = jest.mocked(getLocale);

describe("professional portfolio page", () => {
  it("presents escort portfolio work, privacy, prices, and the Google review link", async () => {
    mockedGetLocale.mockResolvedValue("en");

    render(await ProfessionalPortfolioPage());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Professional portfolio photography in Barcelona",
    );
    expect(screen.getByText(/I welcome escorts/)).toBeInTheDocument();
    expect(screen.getByText(/publication separately/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View packages and prices" }),
    ).toHaveAttribute("href", "/pricing");
    expect(
      screen.getByRole("link", { name: "Review Sensuelle Boudoir on Google" }),
    ).toHaveAttribute("href", "https://g.page/r/CXYGEWUyinIwEBM/review");
  });

  it("uses localized copy in the page and canonical metadata", async () => {
    mockedGetLocale.mockResolvedValue("es");

    const metadata = await generateMetadata();
    render(await ProfessionalPortfolioPage());

    expect(metadata.alternates?.canonical).toBe(
      "https://boudoir.barcelona/professional-portfolio-photography",
    );
    expect(metadata.title).toBe(
      "Fotografía de portfolio profesional en Barcelona",
    );
    expect(screen.getByText(/Trabajo con escorts/)).toBeInTheDocument();
  });
});
