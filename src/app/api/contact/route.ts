import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const message = formData.get("message");

  // Simulate sending an email or saving to a database
  console.log("Form submitted:", { name, email, message });

  return NextResponse.json({
    success: true,
    message: "Thank you for your message. We will get back to you soon!",
  });
}
