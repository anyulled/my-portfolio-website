import { POST } from "@/app/api/booking/route";
import { sendEmailToRecipient } from "@/services/mailer";
import { NextRequest } from "next/server";

// Mock next/server
jest.mock("next/server", () => {
  return {
    NextRequest: jest.fn().mockImplementation((url, options = {}) => {
      return {
        url,
        method: options.method || "GET",
        formData: jest.fn().mockResolvedValue(options.body),
        body: options.body,
        json: jest.fn().mockResolvedValue({}),
      };
    }),
    NextResponse: {
      json: jest.fn((body, options) => {
        const status = options?.status || 200;
        return {
          status,
          json: jest.fn().mockResolvedValue(body),
        };
      }),
    },
  };
});

jest.mock("@/services/mailer", () => ({
  sendEmailToRecipient: jest.fn(),
}));

describe("Booking API", () => {
  beforeEach(() => {});

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if required fields are missing", async () => {
    const formData = new FormData();
    formData.append("fullName", "Test User");

    const req = new NextRequest("http://localhost:3000/api/booking", {
      method: "POST",
      body: formData,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Please fill in all required fields.");

    expect(sendEmailToRecipient).not.toHaveBeenCalled();
  });

  it("should return 400 if email is missing", async () => {
    const formData = new FormData();
    formData.append("fullName", "Test User");
    formData.append("socialAccount", "testuser");
    formData.append("country", "Test Country");
    formData.append("height", "170");
    formData.append("chest", "90");
    formData.append("waist", "70");
    formData.append("hips", "90");
    formData.append("hairColor", "brown");
    formData.append("eyeColor", "brown");
    formData.append("implants", "no");
    formData.append("startDate", "2023-01-01");
    formData.append("endDate", "2023-01-10");
    formData.append("rates", "Test rates");
    formData.append("modelRelease", "yes");
    formData.append("paymentTypes", "cash");

    const req = new NextRequest("http://localhost:3000/api/booking", {
      method: "POST",
      body: formData,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Please fill in all required fields.");

    expect(sendEmailToRecipient).not.toHaveBeenCalled();
  });

  it("should successfully process a valid request with email", async () => {
    const formData = new FormData();
    formData.append("fullName", "Test User");
    formData.append("socialAccount", "testuser");
    formData.append("email", "test@example.com");
    formData.append("country", "Test Country");
    formData.append("height", "170");
    formData.append("chest", "90");
    formData.append("waist", "70");
    formData.append("hips", "90");
    formData.append("hairColor", "brown");
    formData.append("eyeColor", "brown");
    formData.append("implants", "no");
    formData.append("startDate", "2023-01-01");
    formData.append("endDate", "2023-01-10");
    formData.append("rates", "Test rates");
    formData.append("modelRelease", "yes");
    formData.append("paymentTypes", "cash");

    const req = new NextRequest("http://localhost:3000/api/booking", {
      method: "POST",
      body: formData,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe(
      "Thank you for your booking request. We will review your information and get back to you soon!",
    );

    // In test environment, email is not actually sent
    expect(sendEmailToRecipient).not.toHaveBeenCalled();
  });
});
