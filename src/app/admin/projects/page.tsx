import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { saveRow } from "../actions";
import { AdminHeader, BTN, ListFilter, NewRowPanel, StateChip } from "../ui";
import { FIELDS } from "@/lib/admin-fields";
import { PROJECT_STATUS, statusLabel } from "@/lib/labels";
import { projectChecks } from "../checks";
import type { Project, ProjectSection } from "@/lib/types";

export default async function AdminProjects({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; new?: string }> }) {
  const { q, status, new: isNew } = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data, error }, { data: sectionRows }, { data: techRows }, { data: diagramRows }] = await Promise.all([
    supabase.from("projects").select("*").order("position"),
    supabase.from("project_sections").select("project_id, kind, state, body_md"),
    supabase.from("project_technologies").select("project_id"),
    supabase.from("architecture_diagrams").select("project_id"),
  ]);
  const all = (data ?? []) as Project[];
  const sections = (sectionRows ?? []) as (Pick<ProjectSection, "project_id" | "kind" | "state" | "body_md">)[];
  const n = (rows: { project_id: string }[] | null, id: string) => (rows ?? []).filter((r) => r.project_id === id).length;

  const needle = q?.trim().toLowerCase();
  const projects = all.filter((p) => (!status || p.state === status) && (!needle || p.title.toLowerCase().includes(needle)));

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Projects"
        description="Each project is a case study. Open one to edit its details, case-study sections, technologies, diagrams and milestones in one place."
      />

      {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-[13.5px] text-rose-600">{error.message}</p>}

      <NewRowPanel table="projects" fields={FIELDS.projects} action={saveRow} label="New project" defaultOpen={isNew === "1"} openHref="/admin/projects" />

      <ListFilter q={q} status={status} statuses={["published", "draft", "archived"]} />

      {projects.length === 0 ? (
        <p className="card rounded-2xl px-6 py-10 text-center text-[14px] text-muted">
          {all.length === 0 ? "No projects yet. Create your first one above." : "No projects match this filter."}
        </p>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => {
            const checks = projectChecks(p, sections.filter((s) => s.project_id === p.id), n(techRows, p.id), n(diagramRows, p.id));
            const done = checks.filter((c) => c.done).length;
            const live = sections.filter((s) => s.project_id === p.id && s.state === "published").length;
            return (
              <li key={p.id} className="card rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/projects/${p.id}`} className="truncate text-[16.5px] font-semibold hover:text-accent">{p.title}</Link>
                      <StateChip state={p.state} />
                      {p.featured && <span className="rounded-full bg-raised px-2 py-0.5 text-[12px] text-muted">On home page</span>}
                    </div>
                    <p className="mt-1.5 line-clamp-2 max-w-2xl text-[14px] leading-relaxed text-muted">{p.thesis}</p>
                    <p className="mt-2 text-[13px] text-muted">
                      {statusLabel(PROJECT_STATUS, p.status)} · {live} published section{live === 1 ? "" : "s"} · {n(techRows, p.id)} technologies · {n(diagramRows, p.id)} diagram{n(diagramRows, p.id) === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {p.state === "published" && (
                      <a href={`/projects/${p.slug}`} target="_blank" rel="noopener" className={BTN.quiet}>View live ↗</a>
                    )}
                    <Link href={`/admin/projects/${p.id}`} className={BTN.primary}>Open</Link>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised" role="img" aria-label={`${done} of ${checks.length} suggestions done`}>
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(done / checks.length) * 100}%` }} />
                  </div>
                  <Link href={`/admin/projects/${p.id}?tab=publishing`} className="shrink-0 text-[12.5px] text-muted hover:text-ink">
                    {done}/{checks.length} checklist
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
