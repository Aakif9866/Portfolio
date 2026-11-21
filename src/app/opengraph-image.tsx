import { ImageResponse } from "next/og";
import { profile } from "@/data/profile";

export const alt = `${profile.name} · ${profile.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#0b0c0b", color: "#f1f4f1" }}>
        <div style={{ fontSize: 28, color: "#3ddc84", letterSpacing: 4, textTransform: "uppercase" }}>{profile.role}</div>
        <div style={{ fontSize: 76, fontWeight: 600, marginTop: 24 }}>{profile.name}</div>
        <div style={{ fontSize: 30, color: "#858c85", marginTop: 24, maxWidth: 900 }}>
          Backend systems, retrieval pipelines and applied AI.
        </div>
      </div>
    ),
    size,
  );
}
