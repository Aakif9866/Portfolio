import type { Project, ProjectSection } from "@/lib/types";

export type Check = { label: string; done: boolean; tab: string; hint: string };

/**
 * What a strong case study usually has. Suggestions only — nothing here
 * blocks publishing.
 */
export function projectChecks(
  p: Project,
  sections: Pick<ProjectSection, "kind" | "state" | "body_md">[],
  techCount: number,
  diagramCount: number,
): Check[] {
  const live = sections.filter((s) => s.state === "published" && s.body_md?.trim());
  const has = (k: string) => live.some((s) => s.kind === k);
  return [
    { label: "One-line summary", done: !!p.thesis?.trim(), tab: "overview", hint: "Shown on cards and at the top of the page." },
    { label: "Overview section published", done: has("overview"), tab: "case-study", hint: "The first thing a reader sees in the case study." },
    { label: "Problem or motivation", done: has("problem") || has("why"), tab: "case-study", hint: "Why the project exists." },
    { label: "Architecture explained", done: has("architecture") || diagramCount > 0, tab: "architecture", hint: "An architecture section or a diagram." },
    { label: "Technologies tagged", done: techCount > 0, tab: "technologies", hint: "Feeds the Tech Stack page and the project filter." },
    { label: "Repository or demo link", done: !!(p.repo_url || p.demo_url), tab: "overview", hint: "Lets readers see the real thing." },
  ];
}

export const projectOptions = (projects: Pick<Project, "id" | "title">[]) =>
  projects.map((p) => ({ value: p.id, label: p.title }));
