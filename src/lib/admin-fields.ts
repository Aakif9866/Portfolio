/**
 * Every field the admin can edit, per table. One definition drives both sides:
 * the forms render from it (labels, help, required, essential vs advanced),
 * and the server validates against it — a column not listed here cannot be
 * written through the generic save, whatever the request contains.
 */
import { SECTION_LABEL, SECTION_ORDER, TECH_GROUPS } from "./types";
import { EXPERIMENT_STATUS, PROJECT_STATUS } from "./labels";

export type Option = { value: string; label: string };

export type Field = {
  name: string;
  label: string;
  type: "text" | "slug" | "url" | "date" | "number" | "textarea" | "markdown" | "json" | "lines" | "select" | "checkbox" | "project";
  required?: boolean;
  help?: string;
  placeholder?: string;
  /** Rarely changed — tucked into "Advanced settings". */
  advanced?: boolean;
  rows?: number;
  options?: readonly Option[];
};

const opts = (map: Record<string, { label: string }>): Option[] =>
  Object.entries(map).map(([value, v]) => ({ value, label: v.label }));

const SLUG: Field = {
  name: "slug", label: "URL slug", type: "slug", required: true, advanced: true,
  help: "The last part of the page address. Lowercase letters, numbers and hyphens.", placeholder: "my-project",
};
const POSITION: Field = {
  name: "position", label: "Sort order", type: "number", advanced: true,
  help: "Lower numbers appear first. The ↑ ↓ buttons change this for you.",
};

export const FIELDS = {
  projects: [
    { name: "title", label: "Project name", type: "text", required: true, placeholder: "PulseIQ" },
    { name: "thesis", label: "One-line summary", type: "textarea", rows: 2, required: true, help: "Shown on project cards and at the top of the case study. What it does, in one sentence." },
    { name: "summary", label: "Short description", type: "textarea", rows: 3, help: "Used when the one-line summary is empty." },
    { name: "status", label: "Project status", type: "select", required: true, options: opts(PROJECT_STATUS), help: "How far along the work is. Separate from whether the page is published." },
    { name: "role", label: "Your role", type: "text", placeholder: "Solo developer" },
    { name: "started_on", label: "Started", type: "date" },
    { name: "ended_on", label: "Finished", type: "date", help: "Leave empty if still in progress." },
    { name: "repo_url", label: "Repository link", type: "url", placeholder: "https://github.com/…" },
    { name: "demo_url", label: "Live demo link", type: "url", placeholder: "https://…" },
    { name: "featured", label: "Feature on the home page", type: "checkbox", help: "Up to four featured projects appear on the home page." },
    SLUG,
    { name: "kind", label: "Type", type: "select", advanced: true, options: ["project", "experiment", "research", "learning", "prototype"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) },
    { name: "team_size", label: "Team size", type: "number", advanced: true },
    { name: "hero_image_url", label: "Hero image link", type: "url", advanced: true },
    POSITION,
  ],
  project_sections: [
    { name: "project_id", label: "Project", type: "project", required: true },
    { name: "kind", label: "Section", type: "select", required: true, options: SECTION_ORDER.map((k) => ({ value: k, label: SECTION_LABEL[k] })), help: "Sections always appear in a fixed order on the case study, whatever order you add them in." },
    { name: "heading", label: "Custom heading", type: "text", help: "Optional. Replaces the default section name." },
    { name: "body_md", label: "Content", type: "markdown", rows: 14, help: "Markdown: headings, lists, links, tables and code blocks." },
    { ...POSITION, help: "Only matters within the same section type." },
  ],
  project_milestones: [
    { name: "project_id", label: "Project", type: "project", required: true },
    { name: "title", label: "Milestone", type: "text", required: true, placeholder: "First public release" },
    { name: "label", label: "Tag", type: "text", required: true, placeholder: "launch", help: "A short tag shown next to the date, e.g. launch, v2, incident." },
    { name: "occurred_on", label: "Date", type: "date" },
    { name: "reference_url", label: "Link", type: "url", help: "Optional: a release, PR or post about it." },
    { name: "body_md", label: "Details", type: "markdown", rows: 5 },
    POSITION,
  ],
  architecture_diagrams: [
    { name: "project_id", label: "Project", type: "project", required: true },
    { name: "title", label: "Diagram title", type: "text", required: true, placeholder: "Request flow" },
    { name: "description", label: "Description", type: "textarea", rows: 2, help: "One or two sentences shown above the diagram." },
    { name: "image_url", label: "Diagram image link", type: "url", help: "A hosted screenshot of the diagram. Enough on its own — the interactive boxes below are optional." },
    { name: "nodes", label: "Boxes (JSON)", type: "json", rows: 8, advanced: true, help: 'Interactive diagram boxes: [{"id":"api","label":"API","tech":"Node.js","x":0,"y":0,"explanation":"…"}]' },
    { name: "edges", label: "Connections (JSON)", type: "json", rows: 5, advanced: true, help: 'Arrows between boxes: [{"from":"api","to":"db","label":"writes"}]' },
    POSITION,
  ],
  technologies: [
    { name: "name", label: "Name", type: "text", required: true, placeholder: "PostgreSQL" },
    { name: "category", label: "Category", type: "select", required: true, options: TECH_GROUPS.map((g) => ({ value: g.key, label: g.label })) },
    { name: "summary_md", label: "How I use it", type: "markdown", rows: 4, help: "Shown on the Tech Stack page." },
    { name: "url", label: "Official site", type: "url" },
    SLUG,
    { name: "color", label: "Accent colour", type: "text", advanced: true, placeholder: "#336791", help: "Optional hex colour for the name." },
    POSITION,
  ],
  articles: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "dek", label: "Summary", type: "textarea", rows: 2, help: "One or two sentences under the title and in the article list." },
    { name: "body_md", label: "Article", type: "markdown", rows: 18, help: "Markdown. Every save keeps the previous version under Revisions." },
    { name: "difficulty", label: "Level", type: "select", options: [{ value: "intro", label: "Introductory" }, { value: "working", label: "Working knowledge" }, { value: "deep", label: "Deep dive" }] },
    { name: "reading_minutes", label: "Reading time (minutes)", type: "number" },
    { name: "last_reviewed_at", label: "Last reviewed", type: "date", help: "Articles not reviewed for six months show a “Review needed” note." },
    { name: "tested_with", label: "Tested with", type: "text", placeholder: "Next.js 15.5, Postgres 17" },
    SLUG,
    POSITION,
  ],
  experiments: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "summary", label: "Summary", type: "textarea", rows: 3, required: true, help: "Shown on the experiment card." },
    { name: "status", label: "Outcome", type: "select", required: true, options: opts(EXPERIMENT_STATUS) },
    { name: "hypothesis_md", label: "Hypothesis", type: "markdown", rows: 6, help: "What you expected, written before the result." },
    { name: "outcome_md", label: "What happened", type: "markdown", rows: 6, help: "Leave empty while it's in progress." },
    { name: "started_on", label: "Started", type: "date" },
    { name: "ended_on", label: "Finished", type: "date" },
    { name: "tags", label: "Tags", type: "lines", rows: 3, help: "One per line." },
    SLUG,
    POSITION,
  ],
  timeline_entries: [
    { name: "kind", label: "Type", type: "select", required: true, options: [{ value: "work", label: "Work" }, { value: "education", label: "Education" }] },
    { name: "title", label: "Role or qualification", type: "text", required: true, placeholder: "Software Engineer" },
    { name: "organisation", label: "Organisation", type: "text", required: true },
    { name: "start_date", label: "Start date", type: "date", required: true },
    { name: "end_date", label: "End date", type: "date", help: "Leave empty for a current role." },
    { name: "employment_type", label: "Employment type", type: "text", placeholder: "Full-time, Internship…" },
    { name: "location", label: "Location", type: "text" },
    { name: "remote", label: "Remote", type: "checkbox" },
    { name: "url", label: "Organisation website", type: "url" },
    { name: "bullets", label: "Highlights", type: "lines", rows: 6, help: "One per line — what you actually did." },
    POSITION,
  ],
  site_config: [
    { name: "key", label: "Key", type: "text", required: true },
    { name: "value", label: "Value", type: "textarea" },
    { name: "label", label: "Label", type: "text" },
    { name: "group", label: "Group", type: "text" },
  ],
} satisfies Record<string, Field[]>;

export type EditableTable = keyof typeof FIELDS;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Server-side validation. `creating` requires every required field; an update
 * only checks the fields it sends (e.g. a revision restore sends title + body).
 * Returns null when valid, otherwise a readable message naming the field.
 */
export function validateRow(table: EditableTable, row: Record<string, unknown>, creating: boolean): string | null {
  const fields: Field[] = FIELDS[table];
  const byName = new Map(fields.map((f) => [f.name, f]));

  for (const key of Object.keys(row)) {
    if (!byName.has(key)) return `“${key}” cannot be changed here.`;
  }

  for (const f of fields) {
    const present = f.name in row;
    const v = row[f.name];
    const empty = v === null || v === undefined || (Array.isArray(v) && v.length === 0 && f.type !== "lines");
    if (f.required && (creating ? empty : present && empty)) return `${f.label} is required.`;
    if (!present || v === null || v === undefined) continue;

    const s = typeof v === "string" ? v : "";
    switch (f.type) {
      case "slug": if (!SLUG_RE.test(s)) return `${f.label} can only contain lowercase letters, numbers and single hyphens.`; break;
      case "url": if (!URL_RE.test(s)) return `${f.label} must start with http:// or https://.`; break;
      case "date": if (!DATE_RE.test(s) || Number.isNaN(Date.parse(s))) return `${f.label} must be a valid date.`; break;
      case "number": if (typeof v !== "number" || !Number.isInteger(v)) return `${f.label} must be a whole number.`; break;
      case "project": if (!UUID_RE.test(s)) return `Choose a project.`; break;
      case "select": if (f.options && !f.options.some((o) => o.value === s)) return `${f.label}: “${s}” is not one of the options.`; break;
      case "json": if (!Array.isArray(v)) return `${f.label} must be a JSON list ([…]).`; break;
    }
  }

  const start = row.started_on ?? row.start_date;
  const end = row.ended_on ?? row.end_date;
  if (typeof start === "string" && typeof end === "string" && end < start) return "The end date is before the start date.";
  return null;
}
