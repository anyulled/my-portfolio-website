import sitemap from "@/app/sitemap";

jest.mock("@/lib/pricing", () => ({ getPricing: jest.fn() }));
jest.mock("next/server", () => ({ connection: jest.fn() }));

const { getPricing } = jest.requireMock("@/lib/pricing");

describe("public sitemap", () => {
  beforeEach(() => {
    getPricing.mockReset();
  });

  it("uses the latest saved price date only for pricing", async () => {
    getPricing.mockResolvedValue({ inserted_at: "2026-09-01T00:00:00.000Z" });

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain(
      "https://boudoir.barcelona/professional-portfolio-photography",
    );
    expect(urls).toContain("https://boudoir.barcelona/faq");
    expect(urls).toContain("https://boudoir.barcelona/styles");
    expect(
      entries.find((entry) => entry.url.endsWith("/pricing"))?.lastModified,
    ).toBe("2026-09-01T00:00:00.000Z");
    expect(
      entries
        .filter((entry) => !entry.url.endsWith("/pricing"))
        .every((entry) => entry.lastModified === undefined),
    ).toBe(true);
  });

  it("omits the date when no saved pricing is available", async () => {
    getPricing.mockResolvedValue(null);

    const entries = await sitemap();

    expect(entries.every((entry) => entry.lastModified === undefined)).toBe(
      true,
    );
  });
});
