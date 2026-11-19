import { ImageResponse } from "next/og";
import { supabasePublic } from "@/lib/supabase/server";
import { loadCaseStudy } from "@/components/case-study";
import { fetchOrThrow } from "@/lib/db";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { focusAreas, keyFeatures } from "@/lib/project-card";

/**
 * A 1200×600 shareable project card: name, summary, focus areas, key features and links on the
 * left; a mini view of the project's home page on the right. Built only from the project's own
 * published fields. It is the project's social preview and can be downloaded from the case study.
 *
 * Home-page view, in order: the uploaded hero image, else a screenshot of the live demo link
 * (Microlink's free screenshot API, which only ever sees the public demo URL; cached a day, so one call
 * per project per day, inside its free 50/day),
 * else a drawn mock-up of the page. Any failure falls through to the next, so the card always renders.
 */
export const revalidate = 300;

export async function generateStaticParams() {
  const { data } = await fetchOrThrow("project list", (s) => supabasePublic().from("projects").select("slug").abortSignal(s).eq("state", "published"));
  return (data ?? []).map((p) => ({ slug: p.slug }));
}

/** "https://github.com/a/b/" → "github.com/a/b" */
const short = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** An image as a data URL (PNG/JPEG only, ≤3 MB, 8 s, cached a day), or null. */
async function imageData(url: string | null | undefined): Promise<string | null> {
  if (!url || !/^https:\/\//.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 86400 } });
    const type = res.headers.get("content-type")?.split(";")[0] ?? "";
    if (!res.ok || !["image/png", "image/jpeg"].includes(type)) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 3_000_000) return null;
    return `data:${type};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await loadCaseStudy(supabasePublic(), { slug, publishedOnly: true });
  if (!d) return new Response("Not found", { status: 404 });
  const { project: p, tech, sections } = d;

  const summary = p.thesis ?? p.summary;
  const focus = focusAreas(tech, [summary, ...sections.map((s) => s.body_md)].join(" "));
  const features = keyFeatures(sections);
  const shot = (await imageData(p.hero_image_url)) ??
    (p.demo_url ? await imageData(`https://api.microlink.io/?url=${encodeURIComponent(p.demo_url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=1240`) : null);
  const links = [
    { k: "Case study", v: short(`${SITE_URL}/projects/${p.slug}`) },
    p.repo_url ? { k: "Code", v: short(p.repo_url) } : null,
    p.demo_url ? { k: "Live", v: short(p.demo_url) } : null,
  ].filter(Boolean) as { k: string; v: string }[];
  const label = { color: "#6b6b78", fontSize: 14, letterSpacing: 2, textTransform: "uppercase" as const };

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", padding: 48, gap: 44, background: "#000", color: "#f2f2f5", position: "relative" }}>
        <div style={{ position: "absolute", top: -240, left: 120, width: 960, height: 480, borderRadius: 9999, background: "linear-gradient(100deg, #fb923c, #f43f5e, #a855f7, #38bdf8)", opacity: 0.3, filter: "blur(120px)" }} />

        {/* left: what it is */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 560 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 19, color: "#9494a1" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #e11d48, #7c3aed)", color: "#fff", fontSize: 13, fontWeight: 700 }}>SA</div>
              {SITE_NAME} · Project{p.status ? ` · ${p.status[0].toUpperCase()}${p.status.slice(1)}` : ""}
            </div>
            <div style={{ marginTop: 18, fontSize: p.title.length > 26 ? 44 : 54, fontWeight: 700, lineHeight: 1.04, letterSpacing: -1.5 }}>{clip(p.title, 48)}</div>
            {summary && <div style={{ marginTop: 12, fontSize: 21, lineHeight: 1.35, color: "#a1a1ab" }}>{clip(summary, 118)}</div>}
            {focus.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
                {focus.slice(0, 7).map((f) => (
                  <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 11px", borderRadius: 999, border: "1px solid #2a2a33", background: "#0d0d12", fontSize: 15.5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 99, background: f.color }} />{f.label}
                  </div>
                ))}
              </div>
            )}
            {features.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 20 }}>
                <span style={label}>Key features</span>
                {features.map((f) => (
                  <div key={f} style={{ display: "flex", gap: 10, fontSize: 18, color: "#d4d4d8" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 3, flexShrink: 0 }}><path d="M5 12l5 5L20 7" /></svg>{clip(f, 56)}
                  </div>
                ))}
              </div>
            )}
            {tech.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 18 }}>
                <span style={label}>Built with</span>
                <span style={{ fontSize: 17, color: "#a1a1ab" }}>{clip(tech.slice(0, 7).map((t) => t.name).join(" · "), 62)}</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 22, borderTop: "1px solid #24242c", paddingTop: 14 }}>
            {links.map((l) => (
              <div key={l.k} style={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: links.length > 2 ? 172 : 260, overflow: "hidden", whiteSpace: "nowrap" }}>
                <span style={{ ...label, fontSize: 12 }}>{l.k}</span>
                <span style={{ fontSize: 14, color: "#c4b5fd" }}>{clip(l.v, links.length > 2 ? 21 : 30)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* right: mini home-page view in a browser window */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, borderRadius: 18, border: "1px solid #2a2a33", background: "#0a0a0d", overflow: "hidden", boxShadow: "0 30px 80px -30px rgba(0,0,0,0.9)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, height: 40, padding: "0 16px", borderBottom: "1px solid #1f1f26", background: "#111116" }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 11, height: 11, borderRadius: 99, background: c }} />)}
            <div style={{ display: "flex", marginLeft: 14, padding: "4px 14px", borderRadius: 8, background: "#1a1a21", color: "#8a8a96", fontSize: 13 }}>
              {clip(p.demo_url ? short(p.demo_url) : `${short(SITE_URL)}/projects/${p.slug}`, 40)}
            </div>
          </div>
          {shot ? (
            // eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse, not the browser
            <img src={shot} alt="" width={548} height={464} style={{ width: "100%", flex: 1, objectFit: "cover", objectPosition: "top" }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: 28, background: "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(168,85,247,0.22), transparent 70%)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, background: "linear-gradient(135deg, #fb923c, #a855f7)" }} />
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{clip(p.title, 22)}</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>{[44, 36, 40].map((w, i) => <div key={i} style={{ width: w, height: 7, borderRadius: 9, background: "#2a2a33" }} />)}</div>
              </div>
              <div style={{ marginTop: 48, fontSize: 30, fontWeight: 700, lineHeight: 1.1, letterSpacing: -0.8 }}>{clip(p.title, 30)}</div>
              <div style={{ marginTop: 12, fontSize: 15, lineHeight: 1.4, color: "#8a8a96" }}>{clip(summary ?? "", 90)}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <div style={{ width: 110, height: 32, borderRadius: 99, background: "#f2f2f5" }} />
                <div style={{ width: 96, height: 32, borderRadius: 99, border: "1px solid #2a2a33" }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                {[0, 1, 2].map((i) => <div key={i} style={{ flex: 1, height: 74, borderRadius: 12, border: "1px solid #24242c", background: "#101015" }} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 600 },
  );
}
