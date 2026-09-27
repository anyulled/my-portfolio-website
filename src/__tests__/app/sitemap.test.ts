import sitemap from "@/app/sitemap";

describe("public sitemap", () => {
  it("lists service discovery pages without fabricated modification dates", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain(
      "https://boudoir.barcelona/professional-portfolio-photography",
    );
    expect(urls).toContain("https://boudoir.barcelona/faq");
    expect(urls).toContain("https://boudoir.barcelona/styles");
    expect(entries.every((entry) => entry.lastModified === undefined)).toBe(
      true,
    );
  });
});
