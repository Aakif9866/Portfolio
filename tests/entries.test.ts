import { describe, expect, it } from "vitest";
import { cleanSearch, isFetchableUrl, normalizeTags, parseCapture, parsePreview, urlTitle, validateEntry } from "@/lib/entries";

describe("parseCapture", () => {
  it("a bare URL becomes a resource with no title yet", () => {
    expect(parseCapture("https://youtube.com/watch?v=abc")).toEqual({ kind: "link", title: "", body_md: "", url: "https://youtube.com/watch?v=abc", tags: [] });
  });

  it("words around a URL become a note on it; #tags are pulled out", () => {
    expect(parseCapture("great intro to raft https://raft.github.io/ #system-design #DS")).toEqual({
      kind: "link", title: "", body_md: "great intro to raft", url: "https://raft.github.io/", tags: ["system-design", "ds"],
    });
  });

  it("trailing punctuation isn't part of the URL", () => {
    expect(parseCapture("see (https://example.com/a).")?.url).toBe("https://example.com/a");
  });

  it("plain text is a note; a prefix picks the kind", () => {
    expect(parseCapture("remember to read DDIA ch 5")).toMatchObject({ kind: "note", title: "remember to read DDIA ch 5", body_md: "" });
    expect(parseCapture("log: fixed the redis cache stampede #backend")).toMatchObject({ kind: "log", title: "fixed the redis cache stampede", tags: ["backend"] });
    expect(parseCapture("IDEA: a CLI for pgvector benchmarks")).toMatchObject({ kind: "idea" });
    expect(parseCapture("job: https://jobs.example.com/123 backend role")).toMatchObject({ kind: "job", url: "https://jobs.example.com/123", body_md: "backend role" });
  });

  it("long text keeps everything in the body and a short title", () => {
    const c = parseCapture("Today I moved the queue to SQS. It cut retries a lot and simplified the worker.")!;
    expect(c.title).toBe("Today I moved the queue to SQS.");
    expect(c.body_md).toContain("simplified the worker");
  });

  it("empty input, or only tags, captures nothing", () => {
    expect(parseCapture("   ")).toBeNull();
    expect(parseCapture("#ai #ml")).toBeNull();
  });
});

describe("validateEntry", () => {
  const base = { kind: "note", title: "x", body_md: "", url: "", tags: "", status: "", due_on: "" };

  it("accepts the minimum and cleans tags", () => {
    const r = validateEntry({ ...base, tags: "AI, System Design  ai" });
    expect(r).toEqual({ ok: true, row: { kind: "note", title: "x", body_md: "", url: null, tags: ["ai", "system", "design"], status: null, pinned: false, due_on: null } });
  });

  it("needs a title or a link, a known kind, and a status that fits the kind", () => {
    expect(validateEntry({ ...base, title: "" }).ok).toBe(false);
    expect(validateEntry({ ...base, title: "", url: "https://a.dev" }).ok).toBe(true);
    expect(validateEntry({ ...base, kind: "salary" }).ok).toBe(false);
    expect(validateEntry({ ...base, kind: "job", status: "applied" }).ok).toBe(true);
    expect(validateEntry({ ...base, kind: "note", status: "applied" }).ok).toBe(false);
  });

  it("rejects bad links and dates", () => {
    expect(validateEntry({ ...base, url: "javascript:alert(1)" }).ok).toBe(false);
    expect(validateEntry({ ...base, due_on: "2026-13-45" }).ok).toBe(false);
    expect(validateEntry({ ...base, due_on: "2026-12-01" }).ok).toBe(true);
  });

  it("ignores columns it doesn't know", () => {
    const r = validateEntry({ ...base, id: "x", created_at: "y", meta: { a: 1 } });
    expect(r.ok && Object.keys(r.row).sort()).toEqual(["body_md", "due_on", "kind", "pinned", "status", "tags", "title", "url"]);
  });
});

describe("helpers", () => {
  it("normalizeTags dedupes and caps", () => {
    expect(normalizeTags(["#AI", "ai", "", "Node.js"])).toEqual(["ai", "node-js"]);
    expect(normalizeTags(Array.from({ length: 30 }, (_, i) => `t${i}`))).toHaveLength(20);
  });

  it("cleanSearch strips PostgREST filter syntax", () => {
    expect(cleanSearch('redis),title.eq.(x "%*')).toBe("redis title.eq. x");
  });

  it("isFetchableUrl refuses local and private hosts", () => {
    expect(isFetchableUrl("https://github.com/x")).toBe(true);
    for (const u of ["http://localhost:3000", "http://127.0.0.1", "http://10.0.0.5", "http://192.168.1.1", "http://172.20.0.1", "http://169.254.169.254/latest", "http://[::1]/", "file:///etc/passwd", "http://intranet"]) {
      expect(isFetchableUrl(u), u).toBe(false);
    }
  });

  it("parsePreview reads og tags in either attribute order, with fallbacks", () => {
    const html = `<head><title>Fallback &amp; title</title>
      <meta content="Raft Consensus" property="og:title">
      <meta property="og:site_name" content="raft.github.io">
      <meta name="description" content="Understandable consensus">
      <meta property="og:image" content="/logo.png"></head>`;
    expect(parsePreview(html, "https://raft.github.io/")).toEqual({
      title: "Raft Consensus", site: "raft.github.io", description: "Understandable consensus", image: "https://raft.github.io/logo.png",
    });
    expect(parsePreview("<title>Only &#39;this&#39;</title>", "https://a.dev").title).toBe("Only 'this'");
  });

  it("urlTitle gives a readable fallback", () => {
    expect(urlTitle("https://www.github.com/vercel/next.js/")).toBe("github.com/vercel/next.js");
  });
});

describe("entriesToMarkdown", () => {
  it("groups by kind and keeps links, tags and notes", async () => {
    const { entriesToMarkdown } = await import("@/lib/export");
    const e = (o: Partial<import("@/lib/entries").Entry>) => ({ id: "1", kind: "note", title: "", body_md: "", url: null, tags: [], status: null, pinned: false, due_on: null, meta: {}, created_at: "2026-11-19T10:00:00Z", updated_at: "", ...o });
    const md = entriesToMarkdown([e({ kind: "link", title: "Raft\nPaper", url: "https://raft.github.io", tags: ["ds"], status: "to_read" }), e({ title: "A thought", body_md: "more" })], new Date("2026-11-19"));
    expect(md).toContain("## Notes\n\n### A thought\n\nsaved 2026-11-19\n\nmore");
    expect(md).toContain("### Raft Paper\n\n<https://raft.github.io> · status: to_read · #ds · saved 2026-11-19");
    expect(md.indexOf("## Notes")).toBeLessThan(md.indexOf("## Resources"));
  });
});
