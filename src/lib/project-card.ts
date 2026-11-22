/**
 * The shareable project card's stack chips: each technology with its category's colour.
 * Pure, tested in tests/project-card.test.ts.
 */
const COLOR: Record<string, string> = {
  language: "#e4e4e7", frontend: "#38bdf8", backend: "#34d399", database: "#fbbf24",
  ai: "#a855f7", infrastructure: "#fb923c", testing: "#22d3ee", tooling: "#a1a1aa",
};

export function stackChips(tech: { name: string; category: string }[], limit = 10): { label: string; color: string }[] {
  return tech.slice(0, limit).map((t) => ({ label: t.name, color: COLOR[t.category] ?? "#a1a1aa" }));
}
