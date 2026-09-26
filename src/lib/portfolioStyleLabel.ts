import type { PortfolioStyle } from "@/services/portfolio/types";

type PortfolioStyleMessageKey =
  | "portrait"
  | "artistic_nude"
  | "boudoir"
  | "glamour"
  | "swimwear"
  | "fashion"
  | "lifestyle";

export const getPortfolioStyleMessageKey = (
  style: PortfolioStyle,
): PortfolioStyleMessageKey => {
  switch (style) {
    case "portrait":
      return "portrait";
    case "artistic-nude":
      return "artistic_nude";
    case "boudoir":
      return "boudoir";
    case "glamour":
      return "glamour";
    case "swimwear":
      return "swimwear";
    case "fashion":
      return "fashion";
    case "lifestyle":
      return "lifestyle";
  }
};
