import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  // Dev only: React Refresh evaluates strings. Production keeps eval blocked.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""} https://api.github.com`,
  // Article videos: the privacy-enhanced YouTube player only.
  "frame-src https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Uploads go through a Server Action (default limit 1 MB). The app caps files at 4 MB; Vercel at 4.5 MB.
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  images: { remotePatterns: [{ protocol: "https", hostname: "**.githubusercontent.com" }] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
