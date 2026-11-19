import { describe, expect, it } from "vitest";
import { headingSlugger, headings, plainText, readingMinutes, remarkCallouts, rssFeed, slugifyHeading } from "@/lib/markdown";

describe("headings", () => {
  it("slugs are stable and unique per document", () => {
    expect(slugifyHeading("Why RLS, not app checks?")).toBe("why-rls-not-app-checks");
    expect(slugifyHeading("Café & résumé")).toBe("cafe-resume");
    expect(slugifyHeading("!!!")).toBe("section");
    const s = headingSlugger();
    expect([s("Setup"), s("Setup"), s("setup")]).toEqual(["setup", "setup-1", "setup-2"]);
  });

  it("extracts ## and ### with inline markup stripped, skipping code fences", () => {
    const md = "# Title\n## The **plan**\n```sh\n## not a heading\n```\n### Step [one](https://x.dev)\n#### deep\n## The plan";
    expect(headings(md)).toEqual([
      { depth: 2, text: "The plan", id: "the-plan" },
      { depth: 3, text: "Step one", id: "step-one" },
      { depth: 2, text: "The plan", id: "the-plan-1" },
    ]);
  });

  it("plainText", () => expect(plainText("`code` and _em_ ![img](x)")).toBe("code and em img"));
});

describe("readingMinutes", () => {
  it("rounds at ~220 wpm with a floor of 1", () => {
    expect(readingMinutes("short")).toBe(1);
    expect(readingMinutes(Array(1100).fill("word").join(" "))).toBe(5);
    expect(readingMinutes("```\n" + Array(880).fill("x").join(" ") + "\n```")).toBe(2);
  });
});

describe("remarkCallouts", () => {
  const quote = (text: string) => ({ type: "root", children: [{ type: "blockquote", children: [{ type: "paragraph", children: [{ type: "text", value: text }] }] }] });

  it("turns > [!WARNING] into an aside with a title", () => {
    const tree = quote("[!WARNING]\nBack up first.");
    remarkCallouts()(tree);
    const q = tree.children[0] as unknown as { data: { hName: string; hProperties: { className: string[] } }; children: { children: { value: string }[] }[] };
    expect(q.data).toEqual({ hName: "aside", hProperties: { className: ["callout", "callout-warning"] } });
    expect(q.children[0].children[0].value).toBe("Warning");
    expect(q.children[1].children[0].value).toBe("Back up first.");
  });

  it("drops the marker paragraph when it's alone, and ignores ordinary quotes", () => {
    const solo = quote("[!tip]");
    remarkCallouts()(solo);
    expect((solo.children[0] as unknown as { children: unknown[] }).children).toHaveLength(1);
    const plain = quote("Just a quote");
    remarkCallouts()(plain);
    expect((plain.children[0] as { data?: unknown }).data).toBeUndefined();
  });
});

describe("rssFeed", () => {
  it("escapes XML and links each article", () => {
    const xml = rssFeed({ url: "https://site.dev/", title: "A & B", description: "d" }, [{ title: "<RLS> & you", slug: "rls", dek: null, published_at: "2026-11-19T00:00:00Z" }]);
    expect(xml).toContain("<title>A &amp; B</title>");
    expect(xml).toContain("<title>&lt;RLS&gt; &amp; you</title>");
    expect(xml).toContain("<link>https://site.dev/articles/rls</link>");
    expect(xml).toContain("<pubDate>Thu, 19 Nov 2026 00:00:00 GMT</pubDate>");
    expect(xml).not.toContain("<description></description>");
  });
});
