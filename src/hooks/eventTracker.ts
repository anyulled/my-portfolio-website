import * as gtag from "../lib/gtag";

const useAnalyticsEventTracker =
  (category: string) => (action: string, label: string, value?: number) => {
    gtag.event({ action, category, label, value });
  };

export default useAnalyticsEventTracker;