import {
  normalizeResponseLocale,
  renderBoundedResponse,
  renderPricingFollowup,
} from "@/services/instagram/responseTemplates";

describe("response templates", () => {
  it("normalizes Italian language names", () => {
    expect(normalizeResponseLocale("Italiano")).toBe("it");
  });

  it("uses English for an unsupported language", () => {
    expect(normalizeResponseLocale("Português")).toBe("en");
  });

  it("renders only a bounded template and link", () => {
    const result = renderBoundedResponse(
      "model_form",
      "es",
      "https://boudoir.barcelona/booking-a-session?lead=token",
    );

    expect(result).toContain("completa este formulario");
    expect(result).toContain(
      "https://boudoir.barcelona/booking-a-session?lead=token",
    );
  });

  it("renders a localized pricing follow-up", () => {
    const result = renderPricingFollowup(
      "it-IT",
      "https://boudoir.barcelona/pricing",
    );

    expect(result).toContain("sessione");
    expect(result).toContain("https://boudoir.barcelona/pricing");
  });

  it.each(["en", "es", "fr", "ca", "it", "uk"])(
    "supports the %s pricing follow-up locale",
    (language) => {
      expect(
        renderPricingFollowup(language, "https://boudoir.barcelona/pricing"),
      ).toContain("https://boudoir.barcelona/pricing");
    },
  );
});
