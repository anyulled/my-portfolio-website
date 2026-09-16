import { readFile } from "node:fs/promises";
import { join } from "node:path";

const fallbackOpenGraphImage = await readFile(
  join(process.cwd(), "public/images/DSC_7028.jpg"),
);

export const fallbackOpenGraphImageUrl = `data:image/jpeg;base64,${fallbackOpenGraphImage.toString("base64")}`;
