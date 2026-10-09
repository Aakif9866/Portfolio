import { requireAdmin } from "@/lib/auth";
import { saveRow } from "../actions";
import { NewRowPanel, RowActions, StateChip, type Field } from "../ui";
import type { Project } from "@/lib/types";

const FIELDS: Field[] = [
  { name: "title", label: "Title", type: "text" },
  { name: "slug", label: "Slug", type: "text" },
  { name: "thesis", label: "Thesis", type: "textarea", rows: 3, hint: "one sentence, shown on cards" },
  { name: "summary", label: "Summary", type: "textarea", rows: 3 },
  { name: "kind", label: "Kind", type: "select", options: ["project", "experiment", "research", "learning", "prototype"] },
  { name: "status", label: "Status", type: "select", options: ["active", "shipped", "paused", "archived", "exploring"] },
  { name: "role", label: "Role", type: "text" },
  { name: "team_size", label: "Team size", type: "number" },
  { name: "started_on", label: "Started", type: "date" },
  { name: "ended_on", label: "Ended", type: "date" },
  { name: "repo_url", label: "Repository URL", type: "url" },
  { name: "demo_url", label: "Demo URL", type: "url" },
  { name: "hero_image_url", label: "Hero image URL", type: "url" },
  { name: "position", label: "Position", type: "number" },
  { name: "featured", label: "Featured", type: "checkbox" },
];

export default async function AdminProjects() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("projects").select("*").order("position");
  const projects = (data ?? []) as Project[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Projects</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">{projects.length} rows. Drafts are invisible to anonymous visitors.</p>
      </div>

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-[13px] text-rose-500">{error.message}</p>}

      <NewRowPanel table="projects" fields={FIELDS} action={saveRow} label="New project" />

      <ul className="space-y-3">
        {projects.map((p) => (
          <li key={p.id} className="card rounded-2xl p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-[16px] font-semibold">{p.title}</h2>
                  <StateChip state={p.state} />
                  {p.featured && <span className="font-mono text-[10px] uppercase tracking-wider text-faint">featured</span>}
                </div>
                <p className="mt-1 font-mono text-[11.5px] text-faint">/projects/{p.slug} · pos {p.position} · {p.status}</p>
              </div>
            </div>
            <p className="mt-2.5 line-clamp-2 text-[13.5px] leading-relaxed text-muted">{p.thesis}</p>
            <div className="mt-4 border-t border-line pt-3.5">
              <RowActions table="projects" row={p as unknown as Record<string, unknown>} fields={FIELDS} action={saveRow} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
