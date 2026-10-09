export type PublishState = "draft" | "published" | "archived";
export type SectionState = "empty" | "draft" | "published" | "hidden";
export type TechCategory =
  | "language" | "frontend" | "backend" | "database"
  | "ai" | "infrastructure" | "testing" | "tooling";

export type Project = {
  id: string; slug: string; title: string; thesis: string | null; summary: string | null;
  kind: string; status: string; state: PublishState; role: string | null; team_size: number | null;
  started_on: string | null; ended_on: string | null; featured: boolean; position: number;
  hero_image_url: string | null; demo_url: string | null; repo_url: string | null;
  published_at: string | null; updated_at: string;
};

export type ProjectSection = {
  id: string; project_id: string; kind: string; heading: string | null;
  body_md: string | null; position: number; state: SectionState;
};

export type Technology = {
  id: string; slug: string; name: string; category: TechCategory;
  color: string | null; summary_md: string | null; url: string | null; position: number;
};

export type Article = {
  id: string; slug: string; title: string; dek: string | null; body_md: string | null;
  topic_id: string | null; difficulty: string | null; reading_minutes: number | null;
  state: PublishState; published_at: string | null; last_reviewed_at: string | null;
  tested_with: string | null; position: number; updated_at: string;
};

export type Experiment = {
  id: string; slug: string; title: string; summary: string | null;
  hypothesis_md: string | null; outcome_md: string | null; status: string;
  state: PublishState; project_id: string | null; tags: string[] | null;
  started_on: string | null; ended_on: string | null; position: number;
};

export type TimelineEntry = {
  id: string; kind: "work" | "education"; organisation: string; title: string;
  employment_type: string | null; location: string | null; remote: boolean | null;
  start_date: string | null; end_date: string | null; bullets: string[] | null;
  url: string | null; state: PublishState; position: number;
};

export type DiagramNode = { id: string; label: string; tech?: string; x: number; y: number; explanation?: string };
export type DiagramEdge = { from: string; to: string; label?: string };
export type Diagram = {
  id: string; project_id: string; title: string; description: string | null;
  nodes: DiagramNode[]; edges: DiagramEdge[]; position: number;
};

export const SECTION_ORDER = [
  "overview", "problem", "why", "how", "architecture", "data_model", "api",
  "frontend", "backend", "infrastructure", "performance", "testing",
  "decisions", "challenges", "results", "future", "lessons",
] as const;

export const SECTION_LABEL: Record<string, string> = {
  overview: "Overview", problem: "The problem", why: "Why build it", how: "How it works",
  architecture: "Architecture", data_model: "Data model", api: "API", frontend: "Frontend",
  backend: "Backend", infrastructure: "Infrastructure", performance: "Performance",
  testing: "Testing", decisions: "Decisions", challenges: "Challenges", results: "Results",
  future: "What's next", lessons: "Lessons",
};

export const TECH_GROUPS: { key: TechCategory; label: string; accent: string }[] = [
  { key: "language", label: "Languages", accent: "#f43f5e" },
  { key: "frontend", label: "Frontend", accent: "#38bdf8" },
  { key: "backend", label: "Backend", accent: "#34d399" },
  { key: "database", label: "Database", accent: "#fbbf24" },
  { key: "ai", label: "AI / ML", accent: "#a855f7" },
  { key: "infrastructure", label: "Infrastructure", accent: "#fb923c" },
  { key: "testing", label: "Testing", accent: "#22d3ee" },
  { key: "tooling", label: "Tooling", accent: "#94a3b8" },
];
