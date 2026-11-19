import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown } from "@/components/markdown";
import { headings } from "@/lib/markdown";

const md = [
  "# Intro", "## Why RLS", "Text with `code`.", "```ts", "## not a heading", "const a = 1;", "```",
  "### Step one", "> [!WARNING]", "> Back up first.", "", "> plain quote", "",
  "![Diagram](https://x.dev/d.png \"The request flow\")", "", "- [x] done", "- [ ] todo", "", "## Why RLS", "<script>alert(1)</script>",
].join("\n");
const html = renderToStaticMarkup(createElement(Markdown, { anchors: true, children: md }));

describe("Markdown renderer", () => {
  it("gives every TOC entry a matching heading id", () => {
    for (const h of headings(md)) expect(html).toContain(`id="${h.id}"`);
    expect(headings(md).map((h) => h.id)).toEqual(["why-rls", "step-one", "why-rls-1"]);
  });

  it("renders callouts, code bars, captions and task lists", () => {
    expect(html).toMatch(/<aside class="callout callout-warning">\s*<p class="callout-title">Warning<\/p>\s*<p>Back up first\.<\/p>/);
    expect(html).toContain("<blockquote>");
    expect(html).toContain('class="code-bar"><span>ts</span>');
    expect(html).toContain('<span class="md-caption">The request flow</span>');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('href="#why-rls"');
  });

  it("never renders raw HTML from the Markdown", () => {
    expect(html).not.toContain("<script>");
  });
});
