import { getAuthenticatedOperator } from "@/services/instagram/auth";
import { isHarnessFixtureMode } from "@/services/harness/mode";
import { downloadDriveThumbnail } from "@/services/portfolio/drive";
import { getSafeErrorMetadata } from "@/services/portfolio/errorMetadata";
import { connection, NextResponse } from "next/server";
import sharp from "sharp";

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
      { message: "Drive previews are unavailable in fixture mode." },
      { status: 503 },
    );
  }

  const fileId = new URL(request.url).searchParams.get("fileId");
  if (!fileId) {
    return NextResponse.json(
      { message: "A Drive file ID is required." },
      { status: 400 },
    );
  }
  try {
    const thumbnail = await downloadDriveThumbnail(fileId);
    const preview = await sharp(thumbnail)
      .rotate()
      .resize({
        width: 320,
        height: 400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 64 })
      .toBuffer();
    return new NextResponse(preview, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "portfolio_drive_preview_failed",
      getSafeErrorMetadata(error),
    );
    return NextResponse.json(
      { message: "Unable to preview the selected Drive image." },
      { status: 502 },
    );
  }
}
