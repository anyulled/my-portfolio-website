import { POST } from "@/app/api/contact/route";
import { sendEMail } from "@/services/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, options) => ({
      status: options?.status ?? 200,
      json: jest.fn().mockResolvedValue(body),
    })),
  },
}));

jest.mock("@/services/mailer", () => ({
  sendEMail: jest.fn(),
}));

const validMessage = Array.from(
  { length: 40 },
  (_, index) =>
    `This is a meaningful contact message sentence number ${index}.`,
).join(" ");

const createRequest = (values: Record<string, string>) => {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.append(key, value));

  return {
    formData: jest.fn().mockResolvedValue(formData),
    headers: new Headers({ "x-vercel-id": "test-vercel-request" }),
  } as unknown as Request;
};

describe("Contact API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects a message shorter than 200 characters", async () => {
    const request = createRequest({
      name: "Test User",
      email: "test@example.com",
      message: "A short message with spaces",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe(
      "Your message must be at least 200 characters long.",
    );
    expect(sendEMail).not.toHaveBeenCalled();
  });

  it("rejects a long message without whitespace", async () => {
    const request = createRequest({
      name: "Test User",
      email: "test@example.com",
      message: "a".repeat(200),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe(
      "Your message must include spaces between words.",
    );
    expect(sendEMail).not.toHaveBeenCalled();
  });

  it("returns localized validation errors", async () => {
    const request = createRequest({
      locale: "es",
      name: "Test User",
      email: "not-an-email",
      message: validMessage,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Introduce una dirección de correo válida.");
    expect(sendEMail).not.toHaveBeenCalled();
  });

  it("sends a valid message and returns a request reference", async () => {
    jest.mocked(sendEMail).mockResolvedValue({
      messageId: "test-id",
    } as unknown as SMTPTransport.SentMessageInfo);
    const request = createRequest({
      name: "Test User",
      email: "test@example.com",
      message: validMessage,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe(
      "Thank you for your message. We will get back to you soon!",
    );
    expect(data.requestId).toEqual(expect.any(String));
    expect(sendEMail).toHaveBeenCalledWith(
      validMessage,
      "test@example.com",
      "Test User",
    );
  });

  it("returns a retryable error when delivery fails", async () => {
    jest.mocked(sendEMail).mockResolvedValue(null);
    const request = createRequest({
      name: "Test User",
      email: "test@example.com",
      message: validMessage,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.success).toBe(false);
    expect(data.retryable).toBe(true);
    expect(data.requestId).toEqual(expect.any(String));
  });
});
