jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("REDIRECT");
  }),
}));
jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(async () => (key: string) => key),
}));
jest.mock("@/services/instagram/auth", () => ({
  getAuthenticatedOperator: jest.fn(),
}));
jest.mock("@/services/harness/mode", () => ({
  isHarnessFixtureMode: jest.fn(),
}));
jest.mock("@/services/portfolio/repository", () => ({
  getPortfolioDatabase: jest.fn(() => "database"),
  listPortfolioCollections: jest.fn(),
  listPortfolioModels: jest.fn(),
}));
jest.mock("@/components/portfolio/PortfolioManager", () => ({
  __esModule: true,
  default: (props: unknown) => (
    <div data-testid="manager" data-props={JSON.stringify(props)} />
  ),
}));

import { render, screen } from "@testing-library/react";
import PortfolioAdminPage from "@/app/admin/portfolio/page";
import { redirect } from "next/navigation";
import { getAuthenticatedOperator } from "@/services/instagram/auth";
import { isHarnessFixtureMode } from "@/services/harness/mode";
import {
  getPortfolioDatabase,
  listPortfolioCollections,
  listPortfolioModels,
} from "@/services/portfolio/repository";

describe("portfolio administration page", () => {
  beforeEach(() => {
    jest
      .mocked(getAuthenticatedOperator)
      .mockResolvedValue({ id: "operator" } as never);
    jest.mocked(isHarnessFixtureMode).mockReturnValue(false);
    jest.mocked(listPortfolioCollections).mockResolvedValue([]);
    jest.mocked(listPortfolioModels).mockResolvedValue([]);
  });

  afterEach(() => jest.clearAllMocks());

  it("redirects unauthenticated visitors to the login form", async () => {
    jest.mocked(getAuthenticatedOperator).mockResolvedValueOnce(null as never);
    await expect(PortfolioAdminPage()).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith(
      "/instagram/login?next=/admin/portfolio",
    );
  });

  it("renders empty fixture data without contacting Supabase", async () => {
    jest.mocked(isHarnessFixtureMode).mockReturnValueOnce(true);
    render(await PortfolioAdminPage());
    expect(
      JSON.parse(
        screen.getByTestId("manager").getAttribute("data-props") ?? "{}",
      ),
    ).toEqual({ collections: [], models: [] });
    expect(getPortfolioDatabase).not.toHaveBeenCalled();
  });

  it("loads admin collections and models from Supabase", async () => {
    jest
      .mocked(listPortfolioCollections)
      .mockResolvedValueOnce([{ id: "collection" }] as never);
    jest
      .mocked(listPortfolioModels)
      .mockResolvedValueOnce([{ id: "model" }] as never);
    render(await PortfolioAdminPage());
    expect(listPortfolioCollections).toHaveBeenCalledWith("database", {
      includeArchived: true,
    });
    expect(listPortfolioModels).toHaveBeenCalledWith("database");
    expect(
      JSON.parse(
        screen.getByTestId("manager").getAttribute("data-props") ?? "{}",
      ),
    ).toEqual({
      collections: [{ id: "collection" }],
      models: [{ id: "model" }],
    });
  });

  it("renders the admin manager when the portfolio schema is unavailable", async () => {
    const databaseError = Object.assign(
      new Error("Could not find the table 'public.portfolio_collections'"),
      { code: "PGRST205" },
    );
    jest.mocked(listPortfolioCollections).mockRejectedValueOnce(databaseError);
    const errorLog = jest.spyOn(console, "error").mockImplementation();

    render(await PortfolioAdminPage());

    expect(
      JSON.parse(
        screen.getByTestId("manager").getAttribute("data-props") ?? "{}",
      ),
    ).toEqual({
      collections: [],
      models: [],
      databaseUnavailableMessage: "database_unavailable",
    });
    expect(errorLog).toHaveBeenCalledWith(
      "portfolio_admin_load_failed",
      databaseError,
    );
  });
});
