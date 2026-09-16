import { fallbackOpenGraphImageUrl } from "@/lib/openGraphImage";
import { ImageResponse } from "next/og";

export const alt = "Sensuelle Boudoir photography in Barcelona";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
        color: "white",
      }}
    >
      <img
        src={fallbackOpenGraphImageUrl}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(90deg, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.12))",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "64px",
        }}
      >
        <span style={{ fontSize: 64, fontWeight: 700 }}>Sensuelle Boudoir</span>
        <span style={{ fontSize: 32, marginTop: "12px" }}>
          Boudoir Photography in Barcelona
        </span>
      </div>
    </div>,
    size,
  );
}
