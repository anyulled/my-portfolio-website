import {
  createModelReleaseSchema,
  getMadridDate,
  isValidPhone,
} from "@/app/model-release/types";

const signature = "data:image/png;base64,signature";

const validValues = {
  fullName: "Test Model",
  birthDate: "1990-01-01",
  documentNumber: "X1234567",
  email: "model@example.com",
  phone: "+34 600 123 456",
  gender: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  signature,
};

describe("model release schema", () => {
  it("accepts an adult with valid identity and contact details", () => {
    const result =
      createModelReleaseSchema("2026-08-31").safeParse(validValues);

    expect(result.success).toBe(true);
  });

  it.each([
    ["fullName", ""],
    ["birthDate", "2026-01-01"],
    ["documentNumber", "bad"],
    ["email", "not-an-email"],
    ["phone", "abc"],
    ["signature", ""],
  ])("rejects invalid %s", (field, value) => {
    const result = createModelReleaseSchema("2026-08-31").safeParse({
      ...validValues,
      [field]: value,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a model who is not yet 18 on the release date", () => {
    const result = createModelReleaseSchema("2026-08-31").safeParse({
      ...validValues,
      birthDate: "2008-09-01",
    });

    expect(result.success).toBe(false);
    const issues = result.success ? [] : result.error.issues;
    expect(issues[0]?.message).toBe("error_age");
  });

  it("accepts optional fields as empty strings", () => {
    const result =
      createModelReleaseSchema("2026-08-31").safeParse(validValues);

    expect(result.success).toBe(true);
  });

  it("handles Madrid dates and international phone validation", () => {
    expect(getMadridDate(new Date("2026-08-31T22:30:00.000Z"))).toBe(
      "2026-09-01",
    );
    expect(isValidPhone("+44 (20) 1234-5678")).toBe(true);
    expect(isValidPhone("123")).toBe(false);
  });
});
