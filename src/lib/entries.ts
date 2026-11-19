/**
 * The private workspace's rules: what quick capture turns text into, and the server-side
 * allowlist for saving an entry. This file is to `entries` what admin-fields.ts is to the
 * CMS tables — the only columns a save may write, and how each is validated.
 *
 * Pure functions only (no database), so they're unit-tested.
 */
import { ENTRY_KIND, ENTRY_STATUS } from "./labels";

export type Entry = {
  id: string;
  kind: string;
  title: string;
  body_md: string;
  url: string | null;
  tags: string[];
  status: string | null;
  pinned: boolean;
  due_on: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export const KINDS = Object.keys(ENTRY_KIND);
export const MAX_TITLE = 300;
export const MAX_BODY = 100_000;
const MAX_TAGS = 20;

export const statusesFor = (kind: string) => Object.keys(ENTRY_STATUS[kind] ?? {});

/** "AI", "#System Design" → "ai", "system-design". Empty after cleaning → dropped. */
export function normalizeTag(tag: string) {
  return tag.toLowerCase().replace(/^#/, "").trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

export function normalizeTags(tags: string[]) {
  return [...new Set(tags.map(normalizeTag).filter(Boolean))].slice(0, MAX_TAGS);
}

const URL_RE = /https?:\/\/[^\s<>"']+/i;
const PREFIX_RE = /^(note|link|log|idea|goal|job):\s*/i;

export type Capture = { kind: string; title: string; body_md: string; url: string | null; tags: string[] };

/**
 * One line of quick-capture text → an entry. Nothing is required beyond some text:
 * - an optional `log:` / `idea:` / `goal:` / `job:` / `note:` prefix sets the kind;
 * - the first URL makes it a resource (unless a prefix said otherwise) and the rest becomes a note on it;
 * - `#tags` anywhere are pulled out.
 */
export function parseCapture(raw: string): Capture | null {
  let text = raw.trim();
  if (!text) return null;

  let kind: string | null = null;
  const prefix = text.match(PREFIX_RE);
  if (prefix) {
    kind = prefix[1].toLowerCase();
    text = text.slice(prefix[0].length);
  }

  const tags: string[] = [];
  text = text.replace(/(^|\s)#([\p{L}\p{N}][\p{L}\p{N}_-]*)/gu, (_m, lead: string, tag: string) => {
    tags.push(tag);
    return lead;
  });

  const urlMatch = text.match(URL_RE);
  const url = urlMatch ? urlMatch[0].replace(/[).,;!?]+$/, "") : null;
  const rest = (url ? text.replace(urlMatch![0], " ") : text).replace(/\s+/g, " ").trim();

  if (url) {
    // Title is filled from the page later; the user's words are a note on the link.
    return { kind: kind ?? "link", title: "", body_md: rest, url, tags: normalizeTags(tags) };
  }
  if (!rest) return null;
  // Long text: the first sentence (or 120 chars) is the title, the full text the body.
  const firstLine = rest.split(/(?<=[.!?])\s/)[0];
  const title = firstLine.length <= 120 ? firstLine : `${rest.slice(0, 117).trimEnd()}…`;
  return { kind: kind ?? "note", title, body_md: title === rest ? "" : rest, url: null, tags: normalizeTags(tags) };
}

export type EntryInput = {
  kind: string; title: string; body_md: string; url: string | null; tags: string[];
  status: string | null; pinned: boolean; due_on: string | null;
};

/** The columns a save may write. Anything else in the form is ignored. Returns an error message or the clean row. */
export function validateEntry(input: Record<string, unknown>): { ok: true; row: EntryInput } | { ok: false; message: string } {
  const str = (k: string) => (typeof input[k] === "string" ? (input[k] as string).trim() : "");
  const kind = str("kind");
  if (!KINDS.includes(kind)) return { ok: false, message: "Choose what kind of entry this is." };

  const title = str("title");
  if (title.length > MAX_TITLE) return { ok: false, message: `Titles can be at most ${MAX_TITLE} characters.` };
  const body_md = typeof input.body_md === "string" ? input.body_md : "";
  if (body_md.length > MAX_BODY) return { ok: false, message: "That's too long to save as one entry." };

  const url = str("url") || null;
  if (url && !/^https?:\/\/\S+$/i.test(url)) return { ok: false, message: "Links must start with http:// or https://." };
  if (!title && !url) return { ok: false, message: "Give it a title or a link." };

  const status = str("status") || null;
  if (status && !statusesFor(kind).includes(status)) return { ok: false, message: "That status doesn't apply to this kind of entry." };

  const due_on = str("due_on") || null;
  if (due_on && (!/^\d{4}-\d{2}-\d{2}$/.test(due_on) || Number.isNaN(Date.parse(due_on)))) return { ok: false, message: "That date isn't valid." };

  const tagsRaw = Array.isArray(input.tags) ? input.tags.map(String) : str("tags").split(/[,\s]+/);
  return { ok: true, row: { kind, title, body_md, url, tags: normalizeTags(tagsRaw), status, pinned: input.pinned === true || input.pinned === "on", due_on } };
}

/** Search text for PostgREST's `or=(…)` filter: commas, parens, quotes and wildcards would change its meaning. */
export function cleanSearch(q: string) {
  return q.replace(/[,()"'\\%*]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}

/* ── link previews ─────────────────────────────────────────────────────────── */

/**
 * Only fetch public http(s) hosts for link previews — never localhost or private ranges.
 * ponytail: checks the hostname as written; a public name that resolves to a private IP
 * (DNS rebinding) isn't caught. The only caller is the signed-in admin.
 */
export function isFetchableUrl(raw: string) {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") || !h.includes(".") && !h.includes(":")) return false;
  if (/^(127|10|0)\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
  if (h.includes(":") && (h === "::1" || /^(fc|fd|fe80)/.test(h))) return false;
  return true;
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, " ").trim();

function metaContent(html: string, key: string) {
  // <meta property="og:title" content="…"> in either attribute order
  const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`, "i"));
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, "i"));
  const v = (a ?? b)?.[1];
  return v ? decode(v) : null;
}

export type LinkPreview = { title: string | null; site: string | null; description: string | null; image: string | null };

/** Title, site name, description and image from a page's HTML head. */
export function parsePreview(html: string, pageUrl: string): LinkPreview {
  const tag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
  const image = metaContent(html, "og:image") ?? metaContent(html, "twitter:image");
  let imageUrl: string | null = null;
  try { imageUrl = image ? new URL(image, pageUrl).href : null; } catch { /* ignore a bad URL */ }
  return {
    title: metaContent(html, "og:title") ?? metaContent(html, "twitter:title") ?? (tag ? decode(tag) : null),
    site: metaContent(html, "og:site_name"),
    description: metaContent(html, "og:description") ?? metaContent(html, "description"),
    image: imageUrl && /^https:\/\//.test(imageUrl) ? imageUrl : null,
  };
}

/** A readable fallback title: "github.com/vercel/next.js". */
export function urlTitle(raw: string) {
  try {
    const u = new URL(raw);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "")}`.slice(0, MAX_TITLE);
  } catch {
    return raw.slice(0, MAX_TITLE);
  }
}
