/**
 * Career planning rules (private workspace). The career profile and skill notes live in
 * `private_config` as JSON; goals are ordinary entries of kind "goal". This file is the
 * allowlist for both JSON documents and the checklist logic goals use for milestones.
 * Pure functions only, unit-tested.
 */

export const CAREER_KEY = "career";
export const SKILLS_KEY = "skills";

export const CAREER_FIELDS = [
  { key: "current_role", label: "Current role", max: 120, rows: 1 },
  { key: "current_salary", label: "Current salary", max: 60, rows: 1, placeholder: "2.4 LPA" },
  { key: "target_salary", label: "Target salary", max: 60, rows: 1, placeholder: "10 LPA" },
  { key: "target_roles", label: "Roles I'm aiming for", max: 500, rows: 2 },
  { key: "companies", label: "Companies I'm interested in", max: 1000, rows: 2 },
  { key: "short_term", label: "Next 6–12 months", max: 3000, rows: 3 },
  { key: "long_term", label: "Long term", max: 3000, rows: 3 },
  { key: "notes", label: "Strategy notes", max: 10000, rows: 5 },
] as const;

export type Career = Partial<Record<(typeof CAREER_FIELDS)[number]["key"], string>>;

/** Reads `career.<key>` form fields; empty ones are dropped. */
export function validateCareer(input: Record<string, unknown>): { ok: true; value: Career } | { ok: false; message: string } {
  const value: Career = {};
  for (const f of CAREER_FIELDS) {
    const raw = input[`career.${f.key}`];
    const v = typeof raw === "string" ? raw.trim() : "";
    if (!v) continue;
    if (v.length > f.max) return { ok: false, message: `${f.label} can be at most ${f.max} characters.` };
    value[f.key] = v;
  }
  return { ok: true, value };
}

/* ── skills ───────────────────────────────────────────────────────────────── */

export const SKILL_LEVELS: Record<string, string> = { learning: "Learning", comfortable: "Comfortable", strong: "Strong" };

export type SkillNote = { level?: string; want?: boolean; note?: string };
export type Skills = Record<string, SkillNote>;

/** One skill's private note. A note with nothing in it is `null`, meaning "remove it". */
export function validateSkill(name: string, input: { level?: string; want?: boolean; note?: string }):
  { ok: true; key: string; value: SkillNote | null } | { ok: false; message: string } {
  const key = name.trim().replace(/\s+/g, " ");
  if (!key || key.length > 60) return { ok: false, message: "Skill names are 1–60 characters." };
  const level = input.level?.trim() || undefined;
  if (level && !SKILL_LEVELS[level]) return { ok: false, message: "Unknown level." };
  const note = input.note?.trim() || undefined;
  if (note && note.length > 500) return { ok: false, message: "Notes can be at most 500 characters." };
  const value: SkillNote = { ...(level && { level }), ...(input.want && { want: true }), ...(note && { note }) };
  return { ok: true, key, value: Object.keys(value).length ? value : null };
}

/* ── milestones: Markdown task lists in a goal's notes ─────────────────────── */

const TASK_RE = /^(\s*[-*+]\s+\[)([ xX])(\]\s)/;

/** Done / total of the `- [ ]` / `- [x]` items in some Markdown. */
export function checklist(md: string) {
  let done = 0;
  let total = 0;
  for (const line of md.split("\n")) {
    const m = line.match(TASK_RE);
    if (!m) continue;
    total++;
    if (m[2] !== " ") done++;
  }
  return { done, total };
}

/** The task items, in order, for rendering as checkboxes. */
export function tasks(md: string) {
  return md.split("\n").flatMap((line) => {
    const m = line.match(TASK_RE);
    return m ? [{ done: m[2] !== " ", text: line.slice(m[0].length).trim() }] : [];
  });
}

/** Ticks or unticks the n-th task item (0-based). Out-of-range leaves the text unchanged. */
export function toggleTask(md: string, index: number) {
  let n = -1;
  return md.split("\n").map((line) => {
    const m = line.match(TASK_RE);
    if (!m || ++n !== index) return line;
    return line.replace(TASK_RE, `$1${m[2] === " " ? "x" : " "}$3`);
  }).join("\n");
}
