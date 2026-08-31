jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, options?: { status?: number }) => ({
      status: options?.status ?? 200,
      json: async () => body,
    }),
  },
}));

import { POST } from "@/app/api/photography-release/route";
import { archiveReleasePdf } from "@/services/photographyRelease/archive";
import { createPhotographyReleasePdf } from "@/services/photographyRelease/pdf";
import { sendEmail } from "@/services/mailer";

jest.mock("@/services/photographyRelease/archive", () => ({
  archiveReleasePdf: jest.fn(),
}));

jest.mock("@/services/photographyRelease/pdf", () => ({
  createPhotographyReleasePdf: jest.fn(),
}));

jest.mock("@/services/mailer", () => ({
  sendEmail: jest.fn(),
}));

const createRequest = (entries: Record<string, string | string[]>) => {
  const formData = new FormData();
  Object.entries(entries).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, item));
      return;
    }
    formData.append(key, value);
  });
  return {
    formData: async () => formData,
  } as unknown as Request;
};

const validEntries = {
  fullName: "Test Client",
  birthDate: "1990-01-01",
  documentNumber: "X1234567",
  email: "client@example.com",
  phone: "+34 600 123 456",
  usagePermissions: ["social"],
  privacyLevel: "cropped",
  signature: "data:image/png;base64,signature",
  locale: "en",
  sessionDate: "1900-01-01",
};

describe("Photography release API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(createPhotographyReleasePdf)
      .mockResolvedValue(Buffer.from("pdf"));
    jest
      .mocked(archiveReleasePdf)
      .mockResolvedValue("photography-releases/2026-08/release.pdf");
    jest.mocked(sendEmail).mockResolvedValue({} as never);
  });

  it("rejects incomplete client data before generating or sending anything", async () => {
    const response = await POST(createRequest({ locale: "en" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(createPhotographyReleasePdf).not.toHaveBeenCalled();
    expect(archiveReleasePdf).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("generates, archives, and emails the signed PDF twice", async () => {
    const response = await POST(createRequest(validEntries));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(createPhotographyReleasePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionDate: expect.not.stringMatching(/^1900/),
      }),
    );
    expect(archiveReleasePdf).toHaveBeenCalledWith(
      Buffer.from("pdf"),
      expect.not.stringMatching(/^1900/),
    );
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(jest.mocked(sendEmail).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        to: "info@boudoir.barcelona",
        attachments: [expect.objectContaining({ content: Buffer.from("pdf") })],
      }),
    );
    expect(jest.mocked(sendEmail).mock.calls[1][0]).toEqual(
      expect.objectContaining({
        to: "client@example.com",
      }),
    );
  });

  it("does not send email when archiving fails", async () => {
    jest.mocked(archiveReleasePdf).mockRejectedValue(new Error("GCS failed"));

    const response = await POST(createRequest(validEntries));

    expect(response.status).toBe(500);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns a delivery error while retaining the archived PDF", async () => {
    jest.mocked(sendEmail).mockResolvedValueOnce(null);

    const response = await POST(createRequest(validEntries));

    expect(response.status).toBe(502);
    expect(archiveReleasePdf).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});
