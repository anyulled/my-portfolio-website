import { getAuthenticatedOperator } from "@/services/instagram/auth";
import {
  getInstagramDatabase,
  listInstagramConversations,
} from "@/services/instagram/repository";
import { connection, NextResponse } from "next/server";

const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }

  if (typeof error === "object" && error !== null) {
    const candidate = error as {
      code?: unknown;
      details?: unknown;
      hint?: unknown;
      message?: unknown;
    };
    return {
      code: typeof candidate.code === "string" ? candidate.code : undefined,
      details:
        typeof candidate.details === "string" ? candidate.details : undefined,
      hint: typeof candidate.hint === "string" ? candidate.hint : undefined,
      message:
        typeof candidate.message === "string" ? candidate.message : undefined,
    };
  }

  return { message: String(error) };
};

const isMissingInstagramSchema = (error: unknown) => {
  const details = getErrorDetails(error);
  return (
    details.code === "PGRST205" ||
    details.message?.includes("public.instagram_conversations")
  );
};

export async function GET() {
  await connection();
  const requestId = crypto.randomUUID();

  try {
    const operator = await getAuthenticatedOperator();
    if (!operator) {
      return NextResponse.json(
        {
          message:
            "Your admin session has expired. Sign in again to load the inbox.",
          requestId,
        },
        { status: 401 },
      );
    }

    const conversations = await listInstagramConversations(
      getInstagramDatabase(),
    );
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("instagram_conversations_load_failed", {
      requestId,
      error: getErrorDetails(error),
    });

    if (isMissingInstagramSchema(error)) {
      return NextResponse.json(
        {
          message: "The Instagram inbox database is not ready.",
          requestId,
          resolution: "Apply the Instagram Supabase migration, then retry.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        message: "The Instagram inbox is temporarily unavailable.",
        requestId,
        resolution:
          "Retry in a moment. If it continues, check the Vercel logs.",
      },
      { status: 503 },
    );
  }
}
