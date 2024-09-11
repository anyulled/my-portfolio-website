import { NextResponse } from "next/server";
import { sendEMail } from "@/services/mailer";

export async function POST(req: Request) {
  const formData = await req.formData();
  const name: string = formData.get("name")!.toString();
  const email: string = formData.get("email")!.toString();
  const message: string = formData.get("message")!.toString();

  console.log("Form submitted:", { name, email, message });
  const result = await sendEMail(message, email, name);
  console.log(result);

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
