jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import PortfolioAdminError from "@/app/admin/portfolio/error";
import PortfolioError from "@/app/portfolio/error";
import ModelsError from "@/app/models/error";
import StylesError from "@/app/styles/error";

const routeErrors = [
  ["portfolio administration", PortfolioAdminError],
  ["portfolio pages", PortfolioError],
  ["model pages", ModelsError],
  ["style pages", StylesError],
] as const;

describe("portfolio route errors", () => {
  it.each(routeErrors)("shows a safe recovery state for %s", (_, errorPage) => {
    const databaseError = Object.assign(
      new Error("Could not find public.portfolio_collections (PGRST205)"),
      { digest: "database-error" },
    );
    const retry = jest.fn();

    render(createElement(errorPage, { error: databaseError, retry }));

    expect(screen.getByRole("heading")).toHaveTextContent("unavailable_title");
    expect(screen.getByText("unavailable_description")).toBeInTheDocument();
    expect(
      screen.queryByText(/PGRST205|portfolio_collections/),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "retry" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
