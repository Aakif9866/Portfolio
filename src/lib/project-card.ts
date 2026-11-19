/**
 * What the shareable project card says about a project, derived from its own published data.
 * Pure functions, tested in tests/project-card.test.ts.
 */

/** Focus areas from the project's tech categories, in display order. */
const FOCUS: [string, string, string][] = [
  ["frontend", "Frontend", "#38bdf8"], ["backend", "Backend", "#34d399"], ["database", "Data", "#fbbf24"],
  ["ai", "AI / ML", "#a855f7"], ["infrastructure", "DevOps", "#fb923c"], ["testing", "Testing", "#22d3ee"],
];
// ponytail: keyword match for Security; a per-project "focus" field if this ever mislabels one.
const SECURITY = /\b(security|secure|auth\w*|rls|row-level|guardrails?|encrypt\w*|oauth|jwt|csrf|xss|permissions?)\b/i;

export function focusAreas(tech: { category: string }[], writeUp: string): { label: string; color: string }[] {
  const cats = new Set(tech.map((t) => t.category));
  const out = FOCUS.filter(([k]) => cats.has(k)).map(([, label, color]) => ({ label, color }));
  if (SECURITY.test(writeUp)) out.splice(Math.min(2, out.length), 0, { label: "Security", color: "#f43f5e" });
  return out;
}

/** The first few Markdown bullet points from the write-up, as plain short text, best sections first. */
const ORDER = ["results", "overview", "how", "architecture", "decisions", "challenges", "lessons"];
export function keyFeatures(sections: { kind: string; body_md: string | null }[], limit = 3): string[] {
  const rank = (k: string) => (ORDER.indexOf(k) + 1) || 99;
  const sorted = [...sections].sort((a, b) => rank(a.kind) - rank(b.kind));
  const out: string[] = [];
  for (const s of sorted) {
    for (const m of (s.body_md ?? "").matchAll(/^\s*[-*]\s+(.+)$/gm)) {
      const text = m[1]
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, "")
        .split(/\s+[—–]\s+|:\s/)[0].trim();
      if (text.length >= 8 && !out.includes(text)) out.push(text);
      if (out.length === limit) return out;
    }
  }
  return out;
}
