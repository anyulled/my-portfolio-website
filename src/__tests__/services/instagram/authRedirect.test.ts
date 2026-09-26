import { getSafeAuthReturnPath } from "@/services/instagram/authRedirect";

describe("getSafeAuthReturnPath", () => {
  it("allows the authenticated portfolio admin destination", () => {
    expect(getSafeAuthReturnPath("/admin/portfolio")).toBe("/admin/portfolio");
  });

  it.each([
    "/instagram",
    "https://attacker.example",
    "//attacker.example",
    null,
  ])("uses the Instagram inbox as the fallback for %s", (value) => {
    expect(getSafeAuthReturnPath(value)).toBe("/instagram");
  });
});
