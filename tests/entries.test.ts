import { describe, expect, it } from "vitest";
import { cleanSearch, daysSince, ideaColumn, isFetchableUrl, jobTitle, localDay, normalizeTags, parseCapture, parsePreview, slugify, sourceOf, urlTitle, validateEntry, validateJobMeta, weekLabel, weekOf, withStatusChange } from "@/lib/entries";

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
    for (const u of ["http://localhost:3000", "http://127.0.0.1", "http://10.0.0.5", "http://192.168.1.1", "http://172.20.0.1", "http://169.254.169.254/latest", "http://[::1]/", "http://[::ffff:127.0.0.1]/", "http://[::ffff:a9fe:a9fe]/", "file:///etc/passwd", "http://intranet"]) {
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

describe("view helpers", () => {

  it("sourceOf recognises common hosts", () => {
    expect(sourceOf("https://www.youtube.com/watch?v=1").key).toBe("youtube");
    expect(sourceOf("https://youtu.be/1").key).toBe("youtube");
    expect(sourceOf("https://github.com/a/b").key).toBe("github");
    expect(sourceOf("https://m.linkedin.com/posts/x").key).toBe("linkedin");
    expect(sourceOf("https://docs.python.org/3/").key).toBe("docs");
    expect(sourceOf("https://nextjs.org/docs/app").key).toBe("docs");
    expect(sourceOf("https://arxiv.org/abs/1").key).toBe("paper");
    expect(sourceOf("https://someone.substack.com/p/x").key).toBe("blog");
    expect(sourceOf("https://example.com").key).toBe("web");
    expect(sourceOf(null).key).toBe("web");
    expect(sourceOf("not a url").key).toBe("web");
  });

  it("days and weeks are in IST, weeks start on Monday", () => {
    // 20:00 UTC on Sunday 22 Nov is 01:30 IST on Monday 23 Nov → next week
    expect(localDay("2026-11-22T20:00:00Z")).toBe("2026-11-23");
    expect(weekOf("2026-11-22T20:00:00Z")).toBe("2026-11-23");
    expect(weekOf("2026-11-22T10:00:00Z")).toBe("2026-11-16");
    expect(weekLabel("2026-11-16")).toBe("16 Nov – 22 Nov 2026");
  });

  it("ideas without a known status are Someday; slugs are safe", () => {
    expect(ideaColumn(null)).toBe("someday");
    expect(ideaColumn("active")).toBe("active");
    expect(ideaColumn("weird")).toBe("someday");
    expect(slugify("A CLI for pgvector benchmarks!")).toBe("a-cli-for-pgvector-benchmarks");
    expect(slugify("¿¿")).toBe("project");
  });
});

describe("jobs", () => {

  it("validateJobMeta keeps filled fields, reports cleared ones, ignores absent ones", () => {
    const r = validateJobMeta({ "job.company": " Acme ", "job.role": "", "job.applied_on": "2026-11-10", other: "x" });
    expect(r).toEqual({ ok: true, meta: { company: "Acme", applied_on: "2026-11-10" }, cleared: ["role"] });
  });

  it("validateJobMeta rejects bad dates and over-long values", () => {
    expect(validateJobMeta({ "job.applied_on": "10/11/2026" }).ok).toBe(false);
    expect(validateJobMeta({ "job.company": "x".repeat(121) }).ok).toBe(false);
  });

  it("jobTitle", () => {
    expect(jobTitle("Backend Engineer", "Acme")).toBe("Backend Engineer at Acme");
    expect(jobTitle(undefined, "Acme")).toBe("Acme");
    expect(jobTitle("", "")).toBe("");
  });

  it("withStatusChange records history and fills applied_on once", () => {
    const now = new Date("2026-11-19T06:00:00Z");
    const m1 = withStatusChange("job", {}, "saved", "applied", now);
    expect(m1).toEqual({ history: [{ status: "applied", at: now.toISOString() }], applied_on: "2026-11-19" });
    const m2 = withStatusChange("job", { ...m1, applied_on: "2026-11-01" }, "applied", "interviewing", now);
    expect(m2.applied_on).toBe("2026-11-01");
    expect((m2.history as unknown[]).length).toBe(2);
    expect(withStatusChange("job", m2, "interviewing", "interviewing", now)).toBe(m2);
    expect(withStatusChange("idea", { a: 1 }, null, "next", now)).toEqual({ a: 1 });
  });

  it("daysSince counts IST calendar days", () => {
    expect(daysSince("2026-11-17", new Date("2026-11-19T06:00:00Z"))).toBe(2);
    expect(daysSince("2026-11-20", new Date("2026-11-19T06:00:00Z"))).toBe(-1);
  });
});
