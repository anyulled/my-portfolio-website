import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const transporter = nodemailer.createTransport({
  service: "smtp",
  port:465,
  host:"authsmtp.securemail.pro",
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEMail = async (message: string, sender:string, name:string) :Promise<Promise<SMTPTransport.SentMessageInfo> | null> => {
  try {
    return await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      cc: sender,
      subject: `Boudoir Barcelona - New Message from ${name}`,
      text: message,
    });
  } catch (e) {
    console.error(e);
    return null;
  }
};
