import { getAuthenticatedOperator } from "@/services/instagram/auth";
import { isHarnessFixtureMode } from "@/services/harness/mode";
import { downloadDriveImage } from "@/services/portfolio/drive";
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
    const image = await downloadDriveImage(fileId);
    const preview = await sharp(image.buffer)
      .rotate()
      .resize({
        width: 480,
        height: 640,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 72 })
      .toBuffer();
    return new NextResponse(preview, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("portfolio_drive_preview_failed", error);
    return NextResponse.json(
      { message: "Unable to preview the selected Drive image." },
      { status: 502 },
    );
  }
}
