import { del, list, ListBlobResult } from "@vercel/blob";

export async function deleteAllBlobs() {
  const context: { cursor: string | undefined } = { cursor: undefined };

  do {
    const listResult: ListBlobResult = await list({
      cursor: context.cursor,
      limit: 1000,
    });

    if (listResult.blobs.length > 0) {
      await del(listResult.blobs.map((blob) => blob.url));
    }

    context.cursor = listResult.cursor;
  } while (context.cursor);

  console.log("All blobs were deleted");
}

