import { getAuthenticatedOperator } from "@/services/instagram/auth";
import { isHarnessFixtureMode } from "@/services/harness/mode";
import { listDriveFolder } from "@/services/portfolio/drive";
import { connection, NextResponse } from "next/server";

export async function GET(request: Request) {
  await connection();
  if (!(await getAuthenticatedOperator())) {
    return NextResponse.json(
      { message: "An authorized operator session is required." },
      { status: 401 },
    );
  }
  if (isHarnessFixtureMode()) {
    return NextResponse.json(
      { message: "Drive browsing is unavailable in fixture mode." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const folderId = url.searchParams.get("folderId") ?? undefined;
  const pageToken = url.searchParams.get("pageToken") ?? undefined;
  try {
    return NextResponse.json(await listDriveFolder(folderId, pageToken));
  } catch (error) {
    console.error("portfolio_drive_listing_failed", error);
    return NextResponse.json(
      { message: "Unable to browse the configured Drive library." },
      { status: 502 },
    );
  }
}
