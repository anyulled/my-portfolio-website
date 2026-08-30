import { getModelReleaseCopy } from "@/services/modelRelease/copy";

describe("model release copy", () => {
  it("returns localized copy for every supported locale and falls back to English", () => {
    const locales = ["en", "es", "fr", "ca", "it", "uk"];
    const copies = locales.map((locale) => getModelReleaseCopy(locale));

    expect(copies).toHaveLength(6);
    expect(copies.map((copy) => copy.title)).toEqual([
      "Model Release",
      "Contrato de cesión de modelo",
      "Autorisation de modèle",
      "Contracte de cessió de model",
      "Liberatoria della modella",
      "Згода моделі",
    ]);
    expect(getModelReleaseCopy("unsupported").title).toBe("Model Release");
  });
});
