import { POST } from "@/app/api/booking/route";
import { sendEmailToRecipient } from "@/services/mailer";
import { commonAfterEach, commonBeforeEach } from "@/__tests__/utils/testUtils";
import { NextRequest } from "next/server";

// Mock next/server
jest.mock("next/server", () => {
  const mockFormData = () => {
    const formData = new Map();
    return {
      get: jest.fn((key) => formData.get(key)),
      getAll: jest.fn((key) => formData.get(key) || []),
      append: jest.fn((key, value) => formData.set(key, value)),
      set: jest.fn((key, value) => formData.set(key, value)),
      delete: jest.fn((key) => formData.delete(key)),
      has: jest.fn((key) => formData.has(key))
    };
  };

  return {
    NextRequest: jest.fn().mockImplementation((url, options = {}) => {
      const formData = mockFormData();
      return {
        url,
        method: options.method || "GET",
        formData: jest.fn().mockResolvedValue(formData),
        body: options.body,
        json: jest.fn().mockResolvedValue({})
      };
    }),
    NextResponse: {
      json: jest.fn((body, options) => {
        const status = options?.status || 200;
        return {
          status,
          json: jest.fn().mockResolvedValue(body)
        };
      })
    }
  };
});

jest.mock("@/services/mailer", () => ({
  sendEmailToRecipient: jest.fn()
}));

describe("Booking API", () => {
  beforeEach(() => {
    commonBeforeEach();
  });

  afterEach(() => {
    commonAfterEach();
    jest.clearAllMocks();
  });

  it("should return 400 if required fields are missing", async () => {
    const formData = new FormData();
    formData.append("fullName", "Test User");

    const req = new NextRequest("http://localhost:3000/api/booking", {
      method: "POST",
      body: formData
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Please fill in all required fields.");

    expect(sendEmailToRecipient).not.toHaveBeenCalled();
  });
});
