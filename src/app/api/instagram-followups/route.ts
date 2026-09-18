import { after, NextResponse } from "next/server";
import { isInstagramFollowupRequestAuthorized } from "@/services/cron/authorization";
import { processInstagramFollowups } from "@/services/instagram/followups";

export const maxDuration = 60;

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  if (!isInstagramFollowupRequestAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  after(async () => {
    try {
      const summary = await processInstagramFollowups();
      console.info("instagram_followups_completed", { requestId, ...summary });
    } catch (error) {
      console.error("instagram_followups_failed", {
        requestId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return NextResponse.json({ accepted: true, requestId }, { status: 202 });
}
