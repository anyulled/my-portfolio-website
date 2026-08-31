import { contactFormSchema } from "@/services/contactValidation";

const validMessage = Array.from(
  { length: 40 },
  (_, index) =>
    `This is a meaningful contact message sentence number ${index}.`,
).join(" ");

const validValues = {
  name: "Test User",
  email: "test@example.com",
  message: validMessage,
};

describe("contact form schema", () => {
  it("accepts a valid contact message", () => {
    const result = contactFormSchema.safeParse(validValues);

    expect(result.success).toBe(true);
  });

  it.each([
    ["name", ""],
    ["email", "not-an-email"],
    ["message", "A short message with spaces"],
    ["message", "a".repeat(200)],
  ])("rejects invalid %s input", (field, value) => {
    const result = contactFormSchema.safeParse({
      ...validValues,
      [field]: value,
    });

    expect(result.success).toBe(false);
  });

  it("accepts a 200-character message when it contains whitespace", () => {
    const message = `${"a".repeat(198)} b`;
    const result = contactFormSchema.safeParse({
      ...validValues,
      message,
    });

    expect(result.success).toBe(true);
  });
});
