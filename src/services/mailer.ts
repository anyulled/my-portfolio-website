import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import type { SendMailOptions } from "nodemailer";
import type {
  ReleaseRequestContext,
  ReleaseStage,
} from "@/services/releaseDelivery";

const transporter = nodemailer.createTransport({
  service: "smtp",
  port: 465,
  host: "authsmtp.securemail.pro",
  secure: true,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface EmailOptions {
  to?: string;
  cc?: string;
  subject: string;
  text: string;
  attachments?: SendMailOptions["attachments"];
  logContext?: ReleaseRequestContext & { stage: ReleaseStage };
}

/**
 * Sends an email with the provided options
 * @param options Email options including recipient, subject, and message
 * @returns Promise with the send result or null if there was an error
 */
export const sendEmail = async (
  options: EmailOptions,
): Promise<SMTPTransport.SentMessageInfo | null> => {
  try {
    return await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: options.to ?? process.env.EMAIL_USER,
      cc: options.cc,
      subject: options.subject,
      text: options.text,
      attachments: options.attachments,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        ...options.logContext,
        component: "mailer",
        event: "email_send_failed",
        level: "error",
        error: {
          name: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : String(error),
        },
        timestamp: new Date().toISOString(),
      }),
    );
    return null;
  }
};

// Legacy function for backward compatibility
export const sendEMail = async (
  message: string,
  sender: string,
  name: string,
): Promise<SMTPTransport.SentMessageInfo | null> => {
  return sendEmail({
    cc: sender,
    subject: `Boudoir Barcelona - New Message from ${name}`,
    text: message,
  });
};

// Legacy function for backward compatibility
export const sendEmailToRecipient = async (
  message: string,
  recipient: string,
  subject: string,
): Promise<SMTPTransport.SentMessageInfo | null> => {
  return sendEmail({
    to: recipient,
    subject: subject,
    text: message,
  });
};
