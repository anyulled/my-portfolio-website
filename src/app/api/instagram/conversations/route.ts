import { getAuthenticatedOperator } from "@/services/instagram/auth";
import {
  getInstagramDatabase,
  listInstagramConversations,
} from "@/services/instagram/repository";
import { NextResponse } from "next/server";

export async function GET() {
  const operator = await getAuthenticatedOperator();
  if (!operator) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversations = await listInstagramConversations(
      getInstagramDatabase(),
    );
    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json(
      { message: "Unable to load Instagram conversations" },
      { status: 503 },
    );
  }
}
