import { getAuthenticatedOperator } from "@/services/instagram/auth";
import { isHarnessFixtureMode } from "@/services/harness/mode";
import {
  getPortfolioDatabase,
  listPortfolioCollections,
  listPortfolioModels,
} from "@/services/portfolio/repository";
import { redirect } from "next/navigation";
import PortfolioManager from "@/components/portfolio/PortfolioManager";

export default async function PortfolioAdminPage() {
  const operator = await getAuthenticatedOperator();
  if (!operator) {
    redirect("/instagram/login?next=/admin/portfolio");
  }

  const [collections, models] = isHarnessFixtureMode()
    ? [[], []]
    : await Promise.all([
        listPortfolioCollections(getPortfolioDatabase(), {
          includeArchived: true,
        }),
        listPortfolioModels(getPortfolioDatabase()),
      ]);

  return <PortfolioManager collections={collections} models={models} />;
}
