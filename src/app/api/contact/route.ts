import { sendEMail } from "@/services/mailer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const name = formData.get("name")?.toString() ?? "";
  const email = formData.get("email")?.toString() ?? "";
  const message = formData.get("message")?.toString() ?? "";

  const result = await sendEMail(message, email, name);

  if (result == null) {
    return NextResponse.json({
      success: false,
      message:
        "Sorry, we are not able to send your message at the moment. Please try again later.",
    });
  }

  return NextResponse.json({
    success: true,
    message: "Thank you for your message. We will get back to you soon!",
  });
}
