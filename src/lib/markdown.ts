/**
 * Markdown helpers shared by the renderer (components/markdown.tsx), the article page and
 * the RSS feed. The table of contents and the rendered headings use the same slugger in the
 * same order, so every TOC link lands on its heading. Pure functions, unit-tested.
 */

/** "Why RLS, not app checks?" → "why-rls-not-app-checks" */
export function slugifyHeading(text: string) {
  return text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-") || "section";
}

/** Returns a function that gives unique ids for one document: "setup", "setup-1", "setup-2"… */
export function headingSlugger() {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = slugifyHeading(text);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n === 0 ? base : `${base}-${n}`;
  };
}

/** Plain text of a heading line's Markdown: no **, _, `code` ticks or [link](url) syntax. */
export function plainText(md: string) {
  return md.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_`~]/g, "").replace(/<[^>]+>/g, "").trim();
}

export type Heading = { depth: 2 | 3; text: string; id: string };

/** `##` and `###` headings, skipping fenced code blocks. Ids match the rendered page. */
export function headings(md: string): Heading[] {
  const slug = headingSlugger();
  const out: Heading[] = [];
  let fence: string | null = null;
  for (const line of md.split("\n")) {
    const f = line.match(/^\s*(```+|~~~+)/);
    if (f) { fence = fence ? (line.trim().startsWith(fence) ? null : fence) : f[1]; continue; }
    if (fence) continue;
    const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const text = plainText(m[2]);
    const id = slug(text); // every heading level consumes an id, exactly as the renderer does
    if (m[1].length === 2 || m[1].length === 3) out.push({ depth: m[1].length as 2 | 3, text, id });
  }
  return out;
}

/** Minutes at ~220 words a minute, code counted at half weight. Never less than 1. */
export function readingMinutes(md: string) {
  const code = (md.match(/```[\s\S]*?```/g) ?? []).join(" ");
  const prose = md.replace(/```[\s\S]*?```/g, " ");
  const words = (s: string) => (s.match(/[\p{L}\p{N}]+/gu) ?? []).length;
  return Math.max(1, Math.round((words(prose) + words(code) / 2) / 220));
}

/* ── callouts: GitHub's `> [!NOTE]` syntax ─────────────────────────────────── */

const CALLOUTS: Record<string, string> = { NOTE: "Note", TIP: "Tip", IMPORTANT: "Important", WARNING: "Warning", CAUTION: "Caution" };

type MdNode = { type: string; value?: string; children?: MdNode[]; data?: Record<string, unknown> };

/**
 * remark plugin: a blockquote whose first line is `[!NOTE]` (or TIP, IMPORTANT, WARNING,
 * CAUTION) becomes `<aside class="callout callout-note">` with a "Note" title paragraph.
 * Written by hand (no unist-util-visit dependency); it only walks blockquotes.
 */
export function remarkCallouts() {
  return (tree: MdNode) => {
    const walk = (node: MdNode) => {
      for (const child of node.children ?? []) {
        if (child.type === "blockquote") convert(child);
        walk(child);
      }
    };
    walk(tree);
  };
}

function convert(quote: MdNode) {
  const first = quote.children?.[0];
  const text = first?.type === "paragraph" ? first.children?.[0] : undefined;
  const m = text?.type === "text" ? text.value?.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\n?/i) : null;
  if (!m || !text || !first) return;
  const kind = m[1].toUpperCase();
  text.value = text.value!.slice(m[0].length);
  if (!text.value && first.children!.length === 1) quote.children!.shift();
  else if (!text.value) first.children!.shift();
  quote.data = { hName: "aside", hProperties: { className: ["callout", `callout-${kind.toLowerCase()}`] } };
  quote.children!.unshift({ type: "paragraph", data: { hProperties: { className: ["callout-title"] } }, children: [{ type: "text", value: CALLOUTS[kind] }] });
}

/* ── RSS ──────────────────────────────────────────────────────────────────── */

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export function rssFeed(site: { url: string; title: string; description: string }, items: { title: string; slug: string; dek: string | null; published_at: string | null; tags?: string[] | null; video_url?: string | null }[]) {
  const base = site.url.replace(/\/+$/, "");
  const entries = items.map((a) => {
    const link = `${base}/articles/${encodeURIComponent(a.slug)}`;
    return [
      "    <item>",
      `      <title>${xml(a.title)}</title>`,
      `      <link>${xml(link)}</link>`,
      `      <guid isPermaLink="true">${xml(link)}</guid>`,
      a.published_at ? `      <pubDate>${new Date(a.published_at).toUTCString()}</pubDate>` : null,
      a.dek || a.video_url ? `      <description>${xml([a.dek, a.video_url && `Video: ${a.video_url}`].filter(Boolean).join("\n\n"))}</description>` : null,
      ...(a.tags ?? []).filter((t) => t.trim()).map((t) => `      <category>${xml(t.trim())}</category>`),
      "    </item>",
    ].filter(Boolean).join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${xml(site.title)}</title>`,
    `    <link>${xml(base)}/articles</link>`,
    `    <description>${xml(site.description)}</description>`,
    `    <atom:link href="${xml(base)}/feed.xml" rel="self" type="application/rss+xml"/>`,
    ...entries,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
