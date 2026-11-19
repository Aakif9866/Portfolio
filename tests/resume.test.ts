import { describe, expect, it } from "vitest";
import { extractResumeBullets, inlineRuns, newVersionParam, parseResume, placeholders, resumeKey, resumeToTex, starterResume, texEscape } from "@/lib/resume";

const SAMPLE = `# Jane Dev
jane@dev.io | +91 99999 | github.com/jane

## Summary
Backend engineer who likes
boring, reliable systems.

## Experience
### Acme | Software Engineer | Hyderabad | Jun 2025 – Present
- Cut p95 latency by **40%** with a Redis cache
- Owned the CI pipeline

## Skills
- Languages: Python, TypeScript
- Cloud: AWS`;

describe("parseResume", () => {
  const doc = parseResume(SAMPLE);
  it("reads name, contact and sections in order", () => {
    expect(doc.name).toBe("Jane Dev");
    expect(doc.contact).toEqual(["jane@dev.io", "+91 99999", "github.com/jane"]);
    expect(doc.sections.map((s) => s.title)).toEqual(["Summary", "Experience", "Skills"]);
  });
  it("joins wrapped paragraph lines", () => {
    expect(doc.sections[0].blocks).toEqual([{ type: "p", text: "Backend engineer who likes boring, reliable systems." }]);
  });
  it("entries keep their fields and bullets; loose bullets stay loose", () => {
    expect(doc.sections[1].blocks).toEqual([{ type: "entry", fields: ["Acme", "Software Engineer", "Hyderabad", "Jun 2025 – Present"], bullets: ["Cut p95 latency by **40%** with a Redis cache", "Owned the CI pipeline"] }]);
    expect(doc.sections[2].blocks).toEqual([{ type: "bullet", text: "Languages: Python, TypeScript" }, { type: "bullet", text: "Cloud: AWS" }]);
  });
});

describe("helpers", () => {
  it("resumeKey accepts master and versions only", () => {
    expect(resumeKey("master")).toBe("resume.master");
    expect(resumeKey(newVersionParam("0123456789abcdef-x"))).toBe("resume.v.0123456789ab");
    expect(resumeKey("career")).toBeNull();
    expect(resumeKey("v.../../x")).toBeNull();
  });
  it("placeholders lists what's left to fill in", () => {
    expect(placeholders("# [Your full name]\n[Phone] | [Phone]\n- see [docs](x)")).toEqual(["Your full name", "Phone", "docs"]);
  });
  it("inlineRuns splits bold", () => {
    expect(inlineRuns("by **40%** fast")).toEqual([{ bold: false, text: "by " }, { bold: true, text: "40%" }, { bold: false, text: " fast" }]);
  });
  it("extractResumeBullets reads the AI log section and skips dashes", () => {
    const md = "## What I worked on\nx\n## Resume bullets\n- Built a thing\n- —\n* Shipped another\n## After\n- no";
    expect(extractResumeBullets(md)).toEqual(["Built a thing", "Shipped another"]);
    expect(extractResumeBullets("## Resume bullets\n—")).toEqual([]);
    expect(extractResumeBullets("nothing")).toEqual([]);
  });
});

describe("starterResume", () => {
  const text = starterResume({
    contact: { email: "a@b.dev", github: "https://github.com/me", linkedin: null },
    projects: [{ title: "PulseIQ", thesis: "Analytics for small teams.", repo_url: "https://github.com/me/pulseiq", demo_url: null, started_on: "2025-01-01", ended_on: null, tech: ["Next.js", "FastAPI"] }],
    timeline: [],
    skills: [{ label: "Languages", items: ["Python", "TypeScript"] }, { label: "Empty", items: [] }],
  });
  it("uses only portfolio data and marks the rest as placeholders", () => {
    expect(text).toContain("a@b.dev | [Phone] | github.com/me");
    expect(text).toContain("### PulseIQ | Next.js, FastAPI | github.com/me/pulseiq | Jan 2025 – Present");
    expect(text).toContain("- Analytics for small teams.");
    expect(text).toContain("- Languages: Python, TypeScript");
    expect(text).not.toContain("Empty:");
    expect(placeholders(text)).toEqual(expect.arrayContaining(["Your full name", "Phone", "Company", "College"]));
  });
  it("parses back cleanly", () => {
    expect(parseResume(text).sections.map((s) => s.title)).toEqual(["Summary", "Experience", "Projects", "Education", "Skills"]);
  });
});

describe("resumeToTex", () => {
  it("escapes LaTeX specials", () => {
    expect(texEscape("C# & 100% $5 a_b {x} ~ ^ \\ – ok")).toBe("C\\# \\& 100\\% \\$5 a\\_b \\{x\\} \\textasciitilde{} \\textasciicircum{} \\textbackslash{} -- ok");
  });
  it("produces a Jake-style document with the content", () => {
    const tex = resumeToTex(parseResume(SAMPLE));
    expect(tex).toContain("\\documentclass[letterpaper,11pt]{article}");
    expect(tex).toContain("\\textbf{\\Huge \\scshape Jane Dev}");
    expect(tex).toContain("\\href{https://github.com/jane}{\\underline{github.com/jane}}");
    expect(tex).toContain("\\resumeSubheading{Acme}{Software Engineer}{Hyderabad}{Jun 2025 -- Present}");
    expect(tex).toContain("\\resumeItem{Cut p95 latency by \\textbf{40\\%} with a Redis cache}");
    expect(tex).toContain("\\textbf{Languages}{: Python, TypeScript}");
    expect(tex.trim().endsWith("\\end{document}")).toBe(true);
    // balanced environments
    expect((tex.match(/\\begin\{/g) ?? []).length).toBe((tex.match(/\\end\{/g) ?? []).length + (tex.match(/\\newcommand\{\\resume\w*Start\}\{\\begin/g) ?? []).length - (tex.match(/\\newcommand\{\\resume\w*End\}\{\\end/g) ?? []).length);
  });
});
