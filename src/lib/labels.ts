/**
 * One vocabulary for the whole site. Public nav, page headings, the command
 * palette, the footer and the admin all read from here, so a concept has
 * exactly one name. URLs are unchanged (/system, /lab) — only labels moved.
 */

export const NAV = [
  { href: "/projects", label: "Projects" },
  { href: "/system", label: "Tech Stack" },
  { href: "/lab", label: "Experiments" },
  { href: "/articles", label: "Writing" },
  { href: "/experience", label: "Experience" },
  { href: "/about", label: "About" },
] as const;

/** Project lifecycle (projects.status) — how far along the work is. */
export const PROJECT_STATUS: Record<string, { label: string; tone: string }> = {
  active: { label: "In progress", tone: "#34d399" },
  shipped: { label: "Shipped", tone: "#64d2ff" },
  exploring: { label: "Exploring", tone: "#0a84ff" },
  paused: { label: "Paused", tone: "#fbbf24" },
  archived: { label: "Archived", tone: "#8a8a93" },
};

/** Experiment outcome (experiments.status). */
export const EXPERIMENT_STATUS: Record<string, { label: string; tone: string; help: string }> = {
  running: { label: "In progress", tone: "#34d399", help: "Still being tested" },
  success: { label: "Succeeded", tone: "#64d2ff", help: "The hypothesis held" },
  failed: { label: "Failed", tone: "#ff453a", help: "The hypothesis did not hold — the notes say why" },
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

/**
 * Private workspace (admin only). An entry's kind can change at any time; status is
 * optional and its words depend on the kind. Kinds without statuses (note, log) have none.
 */
export const ENTRY_KIND: Record<string, { label: string; plural: string; hint: string }> = {
  note: { label: "Note", plural: "Notes", hint: "Anything" },
  link: { label: "Resource", plural: "Resources", hint: "A link worth keeping" },
  log: { label: "Log", plural: "Logs", hint: "What you worked on or learned" },
  idea: { label: "Idea", plural: "Ideas", hint: "Something to build or try someday" },
  goal: { label: "Goal", plural: "Goals", hint: "Where you want to get to" },
  job: { label: "Job", plural: "Jobs", hint: "An opportunity or application" },
};

export const ENTRY_STATUS: Record<string, Record<string, { label: string; tone: string }>> = {
  link: { to_read: { label: "To read", tone: "#0a84ff" }, reading: { label: "Reading", tone: "#64d2ff" }, done: { label: "Done", tone: "#34d399" } },
  idea: { someday: { label: "Someday", tone: "#8a8a93" }, next: { label: "Next", tone: "#0a84ff" }, active: { label: "Active", tone: "#34d399" }, dropped: { label: "Dropped", tone: "#8a8a93" } },
  goal: { open: { label: "Open", tone: "#64d2ff" }, achieved: { label: "Achieved", tone: "#34d399" }, dropped: { label: "Dropped", tone: "#8a8a93" } },
  job: {
    saved: { label: "Saved", tone: "#8a8a93" }, applied: { label: "Applied", tone: "#64d2ff" }, interviewing: { label: "Interviewing", tone: "#0a84ff" },
    offer: { label: "Offer", tone: "#34d399" }, rejected: { label: "Rejected", tone: "#ff453a" }, closed: { label: "Closed", tone: "#8a8a93" },
  },
};
