import type { Entry } from "./entries";
import { ENTRY_KIND } from "./labels";

/**
 * The workspace as one Markdown document: grouped by kind, each entry a section with a small
 * metadata line and its notes. Readable in any editor, Obsidian included.
 */
export function entriesToMarkdown(entries: Entry[], now = new Date()) {
  const out = [`# Workspace export`, ``, `Exported ${now.toISOString().slice(0, 10)} · ${entries.length} entries`, ``];
  for (const [kind, { plural }] of Object.entries(ENTRY_KIND)) {
    const group = entries.filter((e) => e.kind === kind);
    if (group.length === 0) continue;
    out.push(`## ${plural}`, ``);
    for (const e of group) {
      // A title can't break out of its heading line.
      out.push(`### ${(e.title || e.url || "Untitled").replace(/\s+/g, " ")}`, ``);
      const facts = [
        e.url && `<${e.url}>`,
        e.status && `status: ${e.status}`,
        e.due_on && `due: ${e.due_on}`,
        e.pinned && "pinned",
        e.tags.length > 0 && e.tags.map((t) => `#${t}`).join(" "),
        `saved ${e.created_at.slice(0, 10)}`,
      ].filter(Boolean);
      out.push(facts.join(" · "), ``);
      if (e.body_md.trim()) out.push(e.body_md.trim(), ``);
    }
  }
  return out.join("\n");
}
