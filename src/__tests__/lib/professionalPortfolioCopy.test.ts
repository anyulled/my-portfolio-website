import { locales } from "@/i18n/config";
import { getProfessionalPortfolioCopy } from "@/lib/professionalPortfolioCopy";

describe("professional portfolio copy", () => {
  it.each(locales)(
    "provides the service and privacy details for %s",
    (locale) => {
      const copy = getProfessionalPortfolioCopy(locale);

      expect(copy.title).toBeTruthy();
      expect(copy.intro).toBeTruthy();
      expect(copy.audience).toBeTruthy();
      expect(copy.privacy).toBeTruthy();
      expect(copy.pricingLink).toBeTruthy();
      expect(copy.reviews).toBeTruthy();
    },
  );
});
