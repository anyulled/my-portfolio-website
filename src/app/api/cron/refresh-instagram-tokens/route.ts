import { getInstagramDatabase } from "@/services/instagram/repository";
import { refreshInstagramAccounts } from "@/services/instagram/tokenRefresh";
import { isCronRequestAuthorized } from "@/services/cron/authorization";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!isCronRequestAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await refreshInstagramAccounts(getInstagramDatabase());
    return NextResponse.json(
      { success: summary.failedAccounts.length === 0, ...summary },
      { status: summary.failedAccounts.length === 0 ? 200 : 503 },
    );
  } catch (error) {
    console.error("instagram_token_refresh_job_failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { message: "Instagram token refresh job failed" },
      { status: 503 },
    );
  }
}
