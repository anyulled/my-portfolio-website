import { createInstagramAuthClient } from "@/services/instagram/auth";
import { NextResponse } from "next/server";

const getEmailDomain = (email: string) => email.split("@").at(1) ?? "unknown";

const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  return { name: "UnknownError", message: "Unknown authentication error" };
};

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body: unknown = await request.json();
    const email =
      typeof body === "object" && body !== null && "email" in body
        ? (body as { email?: unknown }).email
        : undefined;
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { message: "A valid email address is required.", requestId },
        { status: 400 },
      );
    }

    const client = await createInstagramAuthClient();
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: new URL("/auth/confirm", request.url).toString(),
      },
    });
    if (error) {
      console.error(
        JSON.stringify({
          event: "instagram_magic_link_failed",
          requestId,
          emailDomain: getEmailDomain(email.trim()),
          error: getErrorDetails(error),
        }),
      );
      return NextResponse.json(
        {
          message: "Unable to send the access link.",
          requestId,
        },
        { status: 502 },
      );
    }

    console.log(
      JSON.stringify({
        event: "instagram_magic_link_requested",
        requestId,
        emailDomain: getEmailDomain(email.trim()),
      }),
    );
    return NextResponse.json({
      message: "Check your email for the access link.",
      requestId,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "instagram_magic_link_error",
        requestId,
        error: getErrorDetails(error),
      }),
    );
    return NextResponse.json(
      { message: "Unable to send the access link.", requestId },
      { status: 503 },
    );
  }
}
