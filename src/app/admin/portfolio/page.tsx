import { getAuthenticatedOperator } from "@/services/instagram/auth";
import { isHarnessFixtureMode } from "@/services/harness/mode";
import {
  getPortfolioDatabase,
  listPortfolioCollections,
  listPortfolioModels,
} from "@/services/portfolio/repository";
import { getSafeErrorMetadata } from "@/services/portfolio/errorMetadata";
import { redirect } from "next/navigation";
import PortfolioManager from "@/components/portfolio/PortfolioManager";
import type {
  PortfolioCollection,
  PortfolioModel,
} from "@/services/portfolio/types";
import { getTranslations } from "next-intl/server";

const getPortfolioAdminData = async (): Promise<{
  collections: PortfolioCollection[];
  models: PortfolioModel[];
  databaseUnavailableMessage?: string;
}> => {
  if (isHarnessFixtureMode()) {
    return { collections: [], models: [] };
  }

  try {
    const database = getPortfolioDatabase();
    const [collections, models] = await Promise.all([
      listPortfolioCollections(database, { includeArchived: true }),
      listPortfolioModels(database),
    ]);
    return { collections, models };
  } catch (error) {
    console.error("portfolio_admin_load_failed", getSafeErrorMetadata(error));
    const t = await getTranslations("portfolio");
    return {
      collections: [],
      models: [],
      databaseUnavailableMessage: t("database_unavailable"),
    };
  }
};

export default async function PortfolioAdminPage() {
  const operator = await getAuthenticatedOperator();
  if (!operator) {
    redirect("/instagram/login?next=/admin/portfolio");
  }

  return <PortfolioManager {...await getPortfolioAdminData()} />;
}
