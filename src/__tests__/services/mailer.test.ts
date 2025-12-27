import { sendEMail, sendEmail, sendEmailToRecipient } from "@/services/mailer";
import nodemailer from "nodemailer";

jest.mock("nodemailer", () => {
  const mockSendMail = jest.fn();

  const mockTransporter = {
    sendMail: mockSendMail
  };

  const mockCreateTransport = jest.fn().mockImplementation(() => {
    return mockTransporter;
  });

  return {
    createTransport: mockCreateTransport
  };
});

const originalEnv = process.env;

describe("Mailer Service", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      EMAIL_USER: "test@example.com",
      EMAIL_PASS: "password123"
    };
    jest.spyOn(console, "error").mockImplementation(() => { });
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe("sendEMail", () => {
    it("should send an email with the correct parameters", async () => {
      const mockTransporter = nodemailer.createTransport();

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const result = await sendEMail(
        "Test message",
        "sender@example.com",
        "Test User"
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: "test@example.com",
        to: "test@example.com",
        cc: "sender@example.com",
        subject: "Boudoir Barcelona - New Message from Test User",
        text: "Test message"
      });

      expect(result).toEqual({ messageId: "test-id" });
    });

    it("should return null when email sending fails", async () => {
      const mockTransporter = nodemailer.createTransport();

      mockTransporter.sendMail.mockRejectedValue(
        new Error("Failed to send email")
      );

      const result = await sendEMail(
        "Test message",
        "sender@example.com",
        "Test User"
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();

      expect(console.error).toHaveBeenCalled();

      expect(result).toBeNull();
    });
  });

  describe("sendEmail", () => {
    it("should send an email with the correct parameters", async () => {
      const mockTransporter = nodemailer.createTransport();

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const result = await sendEmail({
        to: "recipient@example.com",
        cc: "cc@example.com",
        subject: "Test Subject",
        text: "Test message"
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: "test@example.com",
        to: "recipient@example.com",
        cc: "cc@example.com",
        subject: "Test Subject",
        text: "Test message"
      });

      expect(result).toEqual({ messageId: "test-id" });
    });

    it("should use default recipient when \"to\" is not provided", async () => {
      const mockTransporter = nodemailer.createTransport();

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const result = await sendEmail({
        subject: "Test Subject",
        text: "Test message"
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: "test@example.com",
        to: "test@example.com",
        cc: undefined,
        subject: "Test Subject",
        text: "Test message"
      });

      expect(result).toEqual({ messageId: "test-id" });
    });

    it("should return null when email sending fails", async () => {
      const mockTransporter = nodemailer.createTransport();

      mockTransporter.sendMail.mockRejectedValue(
        new Error("Failed to send email")
      );

      const result = await sendEmail({
        to: "recipient@example.com",
        subject: "Test Subject",
        text: "Test message"
      });

      expect(mockTransporter.sendMail).toHaveBeenCalled();

      expect(console.error).toHaveBeenCalled();

      expect(result).toBeNull();
    });
  });

  describe("sendEmailToRecipient", () => {
    it("should send an email to the specified recipient", async () => {
      const mockTransporter = nodemailer.createTransport();

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const result = await sendEmailToRecipient(
        "Test message",
        "recipient@example.com",
        "Test Subject"
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: "test@example.com",
        to: "recipient@example.com",
        cc: undefined,
        subject: "Test Subject",
        text: "Test message"
      });

      expect(result).toEqual({ messageId: "test-id" });
    });

    it("should return null when email sending fails", async () => {
      const mockTransporter = nodemailer.createTransport();

      mockTransporter.sendMail.mockRejectedValue(
        new Error("Failed to send email")
      );

      const result = await sendEmailToRecipient(
        "Test message",
        "recipient@example.com",
        "Test Subject"
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();

      expect(console.error).toHaveBeenCalled();

      expect(result).toBeNull();
    });
  });
});
