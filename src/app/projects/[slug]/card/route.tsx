import { ImageResponse } from "next/og";
import { supabasePublic } from "@/lib/supabase/server";
import { loadCaseStudy } from "@/components/case-study";
import { fetchOrThrow } from "@/lib/db";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * A 1200×630 shareable project card, built from the project's own fields: name, one-line
 * summary, status, role and dates, tech stack, and where to find it (case-study page, repo,
 * live demo). It is the project's social preview and can be downloaded from the case study.
 * Published projects only.
 */
export const revalidate = 300;

export async function generateStaticParams() {
  const { data } = await fetchOrThrow("project list", (s) => supabasePublic().from("projects").select("slug").abortSignal(s).eq("state", "published"));
  return (data ?? []).map((p) => ({ slug: p.slug }));
}

/** "https://github.com/a/b/" → "github.com/a/b" */
const short = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
const year = (d: string | null) => (d ? new Date(d).getFullYear() : null);
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await loadCaseStudy(supabasePublic(), { slug, publishedOnly: true });
  if (!d) return new Response("Not found", { status: 404 });
  const { project: p, tech } = d;

  const start = year(p.started_on);
  const end = year(p.ended_on);
  const when = start ? (end && end !== start ? `${start}–${end}` : end ? `${start}` : `${start}–now`) : null;
  const meta = [p.status, p.role, when].filter(Boolean).join("  ·  ");
  const summary = p.thesis ?? p.summary;
  const links = [
    { k: "Case study", v: short(`${SITE_URL}/projects/${p.slug}`) },
    p.repo_url ? { k: "Code", v: short(p.repo_url) } : null,
    p.demo_url ? { k: "Live", v: short(p.demo_url) } : null,
  ].filter(Boolean) as { k: string; v: string }[];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "#000", color: "#f2f2f5", position: "relative" }}>
        <div style={{ position: "absolute", top: -260, left: 180, width: 900, height: 520, borderRadius: 9999, background: "linear-gradient(100deg, #30d158, #40c8e0, #64d2ff, #0a84ff)", opacity: 0.35, filter: "blur(120px)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, fontWeight: 600 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #0a84ff, #0040dd)", color: "#fff", fontSize: 20, fontWeight: 700 }}>SA</div>
            {SITE_NAME} · Project
          </div>
          {meta && <div style={{ display: "flex", fontSize: 22, color: "#9494a1", textTransform: "capitalize" }}>{meta}</div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: p.title.length > 40 ? 60 : 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{clip(p.title, 70)}</div>
          {summary && <div style={{ fontSize: 28, color: "#9494a1", lineHeight: 1.35 }}>{clip(summary, 150)}</div>}
          {tech.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
              {tech.slice(0, 7).map((t) => (
                <div key={t.id} style={{ display: "flex", padding: "6px 14px", borderRadius: 10, border: "1px solid #2a2a33", borderLeft: `3px solid ${t.color ?? "#0a84ff"}`, background: "#0d0d12", fontSize: 21 }}>{t.name}</div>
              ))}
              {tech.length > 7 && <div style={{ display: "flex", padding: "6px 4px", fontSize: 21, color: "#9494a1" }}>+{tech.length - 7}</div>}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 36, fontSize: 21, borderTop: "1px solid #2a2a33", paddingTop: 22 }}>
          {links.map((l) => (
            <div key={l.k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ color: "#6b6b78", fontSize: 16, textTransform: "uppercase", letterSpacing: 2 }}>{l.k}</span>
              <span style={{ color: "#64d2ff" }}>{clip(l.v, 44)}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
