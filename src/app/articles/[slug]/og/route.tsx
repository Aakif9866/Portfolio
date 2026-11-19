import { ImageResponse } from "next/og";
import { publishedArticles } from "@/lib/queries";
import { cleanTags } from "@/lib/blog";
import { SITE_NAME } from "@/lib/site";

/**
 * A 1200×630 share card for articles without a cover image or video thumbnail: title, summary
 * and tags on the v1 dark background with its aurora gradient. Published articles only.
 */
export const revalidate = 300;

export async function generateStaticParams() {
  return (await publishedArticles()).map((a) => ({ slug: a.slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = (await publishedArticles()).find((x) => x.slug === slug);
  if (!a) return new Response("Not found", { status: 404 });
  const tags = cleanTags(a.tags).slice(0, 4);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#000", color: "#f2f2f5", position: "relative" }}>
        <div style={{ position: "absolute", top: -260, left: 180, width: 900, height: 520, borderRadius: 9999, background: "linear-gradient(100deg, #fb923c, #f43f5e, #a855f7, #38bdf8)", opacity: 0.35, filter: "blur(120px)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, fontWeight: 600 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, #e11d48, #7c3aed)", color: "#fff", fontSize: 22, fontWeight: 700 }}>SA</div>
          {SITE_NAME} · Writing
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: a.title.length > 60 ? 60 : 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{a.title}</div>
          {a.dek && <div style={{ fontSize: 30, color: "#9494a1", lineHeight: 1.35 }}>{a.dek.length > 140 ? `${a.dek.slice(0, 137)}…` : a.dek}</div>}
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 24, color: "#a78bfa" }}>
          {a.video_url ? <span>▶ Video</span> : null}
          {tags.map((t) => <span key={t}>#{t}</span>)}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
