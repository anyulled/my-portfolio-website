import { cache } from "react";
import { getLatestPricing, PricingPackageRecord } from "@/services/database";

export const getPricing = cache(
  async (): Promise<PricingPackageRecord | null> => {
    return getLatestPricing();
  },
);

export type { PricingPackageRecord };
