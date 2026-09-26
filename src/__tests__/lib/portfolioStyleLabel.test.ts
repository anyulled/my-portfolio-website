import { getPortfolioStyleMessageKey } from "@/lib/portfolioStyleLabel";

describe("getPortfolioStyleMessageKey", () => {
  it.each([
    ["portrait", "portrait"],
    ["artistic-nude", "artistic_nude"],
    ["boudoir", "boudoir"],
    ["glamour", "glamour"],
    ["swimwear", "swimwear"],
    ["fashion", "fashion"],
    ["lifestyle", "lifestyle"],
  ] as const)("maps %s to its translation key", (style, key) => {
    expect(getPortfolioStyleMessageKey(style)).toBe(key);
  });
});
