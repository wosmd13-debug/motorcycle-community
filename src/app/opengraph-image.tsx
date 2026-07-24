import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const runtime = "edge";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "linear-gradient(145deg, #f0fdf4 0%, #ffffff 45%, #dcfce7 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#16a34a",
            textTransform: "uppercase",
          }}
        >
          BIKE COMMUNITY
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#14532d",
            lineHeight: 1,
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 36,
            fontWeight: 600,
            color: "#3f3f46",
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          라이더가 모이는 {SITE_TAGLINE}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 24,
            color: "#22c55e",
            fontWeight: 700,
          }}
        >
          byanra.com
        </div>
      </div>
    ),
    { ...size }
  );
}
