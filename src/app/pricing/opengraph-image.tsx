import { getPhotosFromStorage } from "@/services/storage/photos-cached";
import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const alt = "Sensuelle Boudoir Pricing";
export const size = {
  width: 1200,
  height: 630,
};
function generateFallbackImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "1200px",
        height: "630px",
        backgroundColor: "#1a1a2e",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 72, fontWeight: "bold" }}>Sensuelle Boudoir</div>
      <div style={{ fontSize: 32, marginTop: 20, color: "#a0a0a0" }}>
        Pricing & Experiences
      </div>
    </div>,
    { ...size },
  );
}

function getImageUrls(
  photos: Awaited<ReturnType<typeof getPhotosFromStorage>>,
) {
  const imageUrls: string[] = [];
  /*
   * ⚡ Bolt: Replaced chained array methods (.map.filter.slice) with a for...of loop
   * and an early exit. This avoids O(N) iteration over the entire photos array
   * and prevents intermediate array allocations, reducing time complexity to O(limit).
   */
  for (const photo of photos ?? []) {
    if (imageUrls.length >= 3) break;

    const url = photo.srcSet[0]?.src;
    if (url && !url.endsWith(".webp")) {
      imageUrls.push(url);
    }
  }
  return imageUrls;
}

function generatePhotoImage(imageUrls: string[]) {
  const imgStyle = { flex: 1, height: "100%", objectFit: "cover" as const };

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "1200px",
        height: "630px",
        backgroundColor: "#1a1a2e",
      }}
    >
      {imageUrls.map((url) => (
        <img
          src={url}
          alt=""
          style={imgStyle}
          width="400"
          height="630"
          key={url}
        />
      ))}
    </div>,
    { ...size },
  );
}

export default async function PricingImage() {
  console.log("[PricingOG] Starting image generation...");
  try {
    const photos = await getPhotosFromStorage("pricing");
    console.log(
      `[PricingOG] Fetched ${photos?.length ?? 0} photos from storage.`,
    );

    if (!photos || photos.length === 0) {
      console.warn("[PricingOG] No photos found, using fallback.");
      return generateFallbackImage();
    }

    const imageUrls = getImageUrls(photos);

    if (imageUrls.length === 0) {
      console.warn("[PricingOG] No valid non-WebP image URLs, using fallback.");
      return generateFallbackImage();
    }

    console.log(`[PricingOG] Using ${imageUrls.length} remote image URLs.`);

    return generatePhotoImage(imageUrls);
  } catch (error) {
    console.error("[PricingOG] Unexpected error during generation:", error);
    return generateFallbackImage();
  }
}
