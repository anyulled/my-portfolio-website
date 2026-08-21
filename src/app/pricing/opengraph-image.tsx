import { getPhotosFromStorage } from "@/services/storage/photos-cached";
import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const alt = "Sensuelle Boudoir Pricing";
export const size = {
  width: 1200,
  height: 630,
};
export const runtime = "nodejs";
export const revalidate = 3600;
export const dynamic = "force-static";

/**
 * Generates a simple fallback OG image.
 */
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

// eslint-disable-next-line complexity
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

    /*
     * ⚡ Bolt: Replaced chained .map(), .filter(), and .slice() with a single
     * for...of loop. This extracts up to 3 valid non-WebP image URLs in one pass,
     * avoiding redundant intermediate array allocations and O(N) iteration overhead.
     */
    const imageUrls: string[] = [];
    for (const photo of photos) {
      if (imageUrls.length >= 3) break;
      const url = photo.srcSet[0]?.src;
      if (url && !url.endsWith(".webp")) {
        imageUrls.push(url);
      }
    }

    if (imageUrls.length === 0) {
      console.warn("[PricingOG] No valid non-WebP image URLs, using fallback.");
      return generateFallbackImage();
    }

    console.log(`[PricingOG] Using ${imageUrls.length} remote image URLs.`);

    // Use remote URLs directly
    const [img0, img1, img2] = imageUrls;
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
        {img0 && (
          <img src={img0} alt="" style={imgStyle} width="400" height="630" />
        )}
        {img1 && (
          <img src={img1} alt="" style={imgStyle} width="400" height="630" />
        )}
        {img2 && (
          <img src={img2} alt="" style={imgStyle} width="400" height="630" />
        )}
      </div>,
      { ...size },
    );
  } catch (error) {
    console.error("[PricingOG] Unexpected error during generation:", error);
    return generateFallbackImage();
  }
}
