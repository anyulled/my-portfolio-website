jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, options?: { status?: number }) => ({
      status: options?.status ?? 200,
      json: async () => body,
    }),
  },
}));

import { POST } from "@/app/api/model-release/route";
import { archiveReleasePdf } from "@/services/photographyRelease/archive";
import { createModelReleasePdf } from "@/services/modelRelease/pdf";
import { sendEmail } from "@/services/mailer";

jest.mock("@/services/photographyRelease/archive", () => ({
  archiveReleasePdf: jest.fn(),
}));

jest.mock("@/services/modelRelease/pdf", () => ({
  createModelReleasePdf: jest.fn(),
}));

jest.mock("@/services/mailer", () => ({
  sendEmail: jest.fn(),
}));

const createRequest = (entries: Record<string, string>) => {
  const formData = new FormData();
  Object.entries(entries).forEach(([key, value]) =>
    formData.append(key, value),
  );
  return { formData: async () => formData } as unknown as Request;
};

const validEntries = {
  fullName: "Test Model",
  birthDate: "1990-01-01",
  documentNumber: "X1234567",
  email: "model@example.com",
  phone: "+34 600 123 456",
  gender: "",
  address: "",
  city: "Barcelona",
  state: "Barcelona",
  country: "Spain",
  postalCode: "08001",
  signature: "data:image/png;base64,signature",
  locale: "en",
};

describe("Model release API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(createModelReleasePdf).mockResolvedValue(Buffer.from("pdf"));
    jest
      .mocked(archiveReleasePdf)
      .mockResolvedValue("model-releases/2026-08/release.pdf");
    jest.mocked(sendEmail).mockResolvedValue({} as never);
  });

  it("rejects incomplete model data before generating or sending", async () => {
    const response = await POST(createRequest({ locale: "en" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(createModelReleasePdf).not.toHaveBeenCalled();
    expect(archiveReleasePdf).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("controls date and photographer data on the server", async () => {
    const response = await POST(
      createRequest({
        ...validEntries,
        releaseDate: "1900-01-01",
        photographer: "Attacker",
      }),
    );

    expect(response.status).toBe(200);
    expect(createModelReleasePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        releaseDate: expect.not.stringMatching(/^1900/),
      }),
    );
    expect(archiveReleasePdf).toHaveBeenCalledWith(
      Buffer.from("pdf"),
      expect.not.stringMatching(/^1900/),
      "model",
    );
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(jest.mocked(sendEmail).mock.calls[0][0]).toEqual(
      expect.objectContaining({ to: "info@boudoir.barcelona" }),
    );
    expect(jest.mocked(sendEmail).mock.calls[1][0]).toEqual(
      expect.objectContaining({ to: "model@example.com" }),
    );
  });

  it("does not send email when archiving fails", async () => {
    jest.mocked(archiveReleasePdf).mockRejectedValue(new Error("GCS failed"));

    const response = await POST(createRequest(validEntries));

    expect(response.status).toBe(500);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it.each([
    [
      "birth date",
      "birthDate",
      "2027-01-01",
      "Enter a valid birth date before the release date.",
    ],
    [
      "age",
      "birthDate",
      "2008-09-01",
      "You must be at least 18 years old to sign this release.",
    ],
    [
      "document number",
      "documentNumber",
      "bad",
      "Enter a valid DNI, NIE, or passport number.",
    ],
    ["email", "email", "invalid", "Enter a valid email address."],
    ["phone", "phone", "invalid", "Enter a valid international phone number."],
    ["signature", "signature", "invalid", "A drawn signature is required."],
  ])(
    "returns a localized validation error for invalid %s",
    async (_name, field, value, expectedMessage) => {
      const response = await POST(
        createRequest({ ...validEntries, [field]: value }),
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.message).toBe(expectedMessage);
    },
  );

  it("retains the archive when photographer email delivery fails", async () => {
    jest.mocked(sendEmail).mockResolvedValueOnce(null);

    const response = await POST(createRequest(validEntries));

    expect(response.status).toBe(502);
    expect(archiveReleasePdf).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("retains the archive when model email delivery fails", async () => {
    jest
      .mocked(sendEmail)
      .mockResolvedValueOnce({} as never)
      .mockResolvedValueOnce(null);

    const response = await POST(createRequest(validEntries));

    expect(response.status).toBe(502);
    expect(archiveReleasePdf).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });
});
