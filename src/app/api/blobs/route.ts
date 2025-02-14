import { NextResponse } from "next/server";
import { deleteAllBlobs } from "@/lib/delete-blobs";
import { headers } from "next/headers";

export async function GET() {
  const headersList = await headers();
  const authToken = headersList.get("BLOB_READ_WRITE_TOKEN");

  if (!authToken || authToken !== process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { message: "Unauthorized - Invalid or missing token" },
      { status: 401 },
    );
  }

  try {
    await deleteAllBlobs();
  } catch (e) {
    return NextResponse.json(
      { message: "Error deleting all blobs: " + e },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: "Deleted all blobs",
    status: 200,
  });
}
