import { del, list, ListBlobResult } from "@vercel/blob";

export async function deleteAllBlobs() {
  let cursor: string | undefined = undefined;

  do {
    const listResult: ListBlobResult = await list({ cursor, limit: 1000 });

    if (listResult.blobs.length > 0) {
      await del(listResult.blobs.map((blob) => blob.url));
    }

    cursor = listResult.cursor;
  } while (cursor);

  console.log("All blobs were deleted");
}

deleteAllBlobs().catch((error) => {
  console.error("An error occurred:", error);
});
