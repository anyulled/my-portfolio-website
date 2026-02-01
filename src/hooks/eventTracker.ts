import { useCallback } from "react";
import * as gtag from "@/lib/gtag";

const useAnalyticsEventTracker = (category: string) => {
  return useCallback(
    (action: string, label: string, value?: number) => {
      gtag.event({ action, category, label, value });
    },
    [category],
  );
};

export default useAnalyticsEventTracker;
