import { ImageResponse } from "next/og";

// iOS home-screen icon: the same SA mark as icon.svg, rendered once at build time.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg, #7c3aed, #a855f7 50%, #ec4899)" }}>
        <svg width="180" height="180" viewBox="0 0 32 32" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 11.2C13 9.6 11.6 9 10 9 7.8 9 6.4 10.3 6.4 12.2c0 4.2 7.6 2.4 7.6 7.2 0 2.2-1.7 3.6-4 3.6-1.8 0-3.2-.8-4-2.4" />
          <path d="M17 23l4.5-14L26 23M18.6 18h5.8" />
        </svg>
      </div>
    ),
    size,
  );
}
