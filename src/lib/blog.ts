/**
 * Blog rules shared by the article pages, tag pages, feed and Markdown renderer: YouTube
 * links (the blog is the written companion to the channel), tag slugs and related posts.
 * Pure functions, tested in tests/blog.test.ts.
 */
const YT_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "www.youtube-nocookie.com"]);
const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * The 11-character video id from any common YouTube URL (watch, youtu.be, shorts, live,
 * embed), or null. Only YouTube hosts count, so a lookalike domain can't become an embed.
 */
export function youtubeId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (!YT_HOSTS.has(u.hostname.toLowerCase())) return null;
  const parts = u.pathname.split("/").filter(Boolean);
  const id = u.hostname.endsWith("youtu.be") ? parts[0]
    : parts[0] === "watch" || parts.length === 0 ? u.searchParams.get("v")
    : ["shorts", "live", "embed"].includes(parts[0]) ? parts[1]
    : null;
  return id && YT_ID.test(id) ? id : null;
}

/** Start time in seconds from `t=90`, `t=1m30s` or `start=90`; 0 when absent. */
export function youtubeStart(raw: string): number {
  let u: URL;
  try { u = new URL(raw); } catch { return 0; }
  const t = u.searchParams.get("t") ?? u.searchParams.get("start");
  if (!t) return 0;
  if (/^\d+$/.test(t)) return Number(t);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);
  return m ? (Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)) : 0;
}

/** Privacy-enhanced embed URL (no cookies until the visitor presses play). */
export const youtubeEmbed = (id: string, start = 0) =>
  `https://www.youtube-nocookie.com/embed/${id}${start > 0 ? `?start=${start}` : ""}`;

export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** URL-safe tag: "System Design" → "system-design", "C++" → "cplusplus", "C#" → "csharp". Tag pages match on this. */
export const tagSlug = (tag: string) =>
  tag.toLowerCase().replace(/\+/g, "plus").replace(/#/g, "sharp").normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

/** Distinct, trimmed, non-empty tags in their original spelling. */
export function cleanTags(tags: readonly string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags ?? []) {
    const name = t.trim();
    const key = tagSlug(name);
    if (!name || !key || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

type Taggable = { slug: string; tags?: string[] | null; published_at?: string | null };

/** Up to `limit` other posts ranked by shared tags, then recency. Posts sharing no tag are left out. */
export function relatedPosts<T extends Taggable>(current: Taggable, all: T[], limit = 3): T[] {
  const mine = new Set(cleanTags(current.tags).map(tagSlug));
  if (mine.size === 0) return [];
  return all
    .filter((a) => a.slug !== current.slug)
    .map((a) => ({ a, score: cleanTags(a.tags).filter((t) => mine.has(tagSlug(t))).length }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || String(y.a.published_at ?? "").localeCompare(String(x.a.published_at ?? "")))
    .slice(0, limit)
    .map((x) => x.a);
}

/** Every tag across posts with its count, most used first; the display name is the first spelling seen. */
export function tagCounts(all: Taggable[]): { name: string; slug: string; count: number }[] {
  const map = new Map<string, { name: string; slug: string; count: number }>();
  for (const a of all) for (const name of cleanTags(a.tags)) {
    const slug = tagSlug(name);
    const e = map.get(slug) ?? { name, slug, count: 0 };
    e.count++;
    map.set(slug, e);
  }
  return [...map.values()].sort((x, y) => y.count - x.count || x.name.localeCompare(y.name));
}
