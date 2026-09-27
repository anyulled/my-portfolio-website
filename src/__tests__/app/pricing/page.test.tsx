import PricingPage from "@/app/pricing/page";
import { getPricing } from "@/lib/pricing";
import { render, screen } from "@testing-library/react";

jest.mock("@/lib/pricing", () => ({ getPricing: jest.fn() }));
jest.mock("@/services/storage/photos-cached", () => ({
  getPhotosFromStorage: jest.fn(async () => []),
}));
jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(async () => (key: string) => {
    const messages =
      jest.requireActual<typeof import("@/messages/en.json")>(
        "@/messages/en.json",
      );
    return String(Reflect.get(messages.pricing, key));
  }),
}));
jest.mock("next/font/google", () => ({
  Aref_Ruqaa: jest.fn(() => ({ className: "" })),
  Dancing_Script: jest.fn(() => ({ className: "" })),
}));
jest.mock("@/components/AnimatedPackages", () => ({
  __esModule: true,
  default: ({ packages }: { packages: { price: string }[] }) => (
    <div data-testid="packages">
      {packages.map((pkg, index) => (
        <span key={index}>{pkg.price}</span>
      ))}
    </div>
  ),
}));
jest.mock("@/components/FadeInTitle", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockedGetPricing = jest.mocked(getPricing);

describe("PricingPage", () => {
  beforeEach(() => mockedGetPricing.mockReset());

  it("displays database prices in cards and structured offers", async () => {
    mockedGetPricing.mockResolvedValue({
      id: "current",
      inserted_at: "2026-09-01T00:00:00Z",
      express_price: 225,
      experience_price: 375,
      deluxe_price: 625,
    });

    render(await PricingPage());

    expect(screen.getByTestId("packages")).toHaveTextContent("225 €375 €625 €");
    const offers = JSON.parse(
      document.querySelector('script[type="application/ld+json"]')
        ?.textContent ?? "[]",
    );
    expect(offers.map((offer: { price: string }) => offer.price)).toEqual([
      "225",
      "375",
      "625",
    ]);
  });

  it("does not show or publish invented amounts without database pricing", async () => {
    mockedGetPricing.mockResolvedValue(null);

    render(await PricingPage());

    expect(
      screen.getAllByText("Contact us for the current price"),
    ).toHaveLength(3);
    expect(screen.queryByText(/200 €|350 €|600 €/)).not.toBeInTheDocument();
    const offers = JSON.parse(
      document.querySelector('script[type="application/ld+json"]')
        ?.textContent ?? "[]",
    );
    expect(offers).toEqual([]);
  });
});
