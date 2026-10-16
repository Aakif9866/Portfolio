/**
 * One vocabulary for the whole site. Public nav, page headings, the command
 * palette, the footer and the admin all read from here, so a concept has
 * exactly one name. URLs are unchanged (/system, /lab) — only labels moved.
 */

export const NAV = [
  { href: "/projects", label: "Projects" },
  { href: "/system", label: "Tech Stack" },
  { href: "/lab", label: "Experiments" },
  { href: "/articles", label: "Articles" },
  { href: "/experience", label: "Experience" },
  { href: "/about", label: "About" },
] as const;

/** Project lifecycle (projects.status) — how far along the work is. */
export const PROJECT_STATUS: Record<string, { label: string; tone: string }> = {
  active: { label: "In progress", tone: "#34d399" },
  shipped: { label: "Shipped", tone: "#38bdf8" },
  exploring: { label: "Exploring", tone: "#a855f7" },
  paused: { label: "Paused", tone: "#fbbf24" },
  archived: { label: "Archived", tone: "#8a8a93" },
};

/** Experiment outcome (experiments.status). */
export const EXPERIMENT_STATUS: Record<string, { label: string; tone: string; help: string }> = {
  running: { label: "In progress", tone: "#34d399", help: "Still being tested" },
  success: { label: "Succeeded", tone: "#38bdf8", help: "The hypothesis held" },
  failed: { label: "Failed", tone: "#f43f5e", help: "The hypothesis did not hold — the notes say why" },
  paused: { label: "Paused", tone: "#fbbf24", help: "On hold" },
  abandoned: { label: "Abandoned", tone: "#8a8a93", help: "Stopped deliberately — the notes say why" },
};

/**
 * Publication state (the `state` column). Public pages query state =
 * 'published' only, so drafts and archived items are neither listed nor
 * reachable by URL — these descriptions match that behaviour.
 */
export const PUBLISH_STATE: Record<string, { label: string; tone: string; help: string }> = {
  draft: { label: "Draft", tone: "#fbbf24", help: "Not visible on public pages" },
  published: { label: "Published", tone: "#34d399", help: "Visible on public pages" },
  archived: { label: "Archived", tone: "#8a8a93", help: "Kept for reference; not shown publicly" },
  hidden: { label: "Hidden", tone: "#8a8a93", help: "Not shown on the case study" },
  empty: { label: "Empty", tone: "#8a8a93", help: "Placeholder with no content; not shown" },
};

export const statusLabel = (map: Record<string, { label: string }>, key: string | null | undefined) =>
  (key && map[key]?.label) || (key ? key.charAt(0).toUpperCase() + key.slice(1) : "");
