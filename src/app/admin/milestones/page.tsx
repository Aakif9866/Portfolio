import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { saveRow } from "../actions";
import { AdminHeader, NewRowPanel, RowActions } from "../ui";
import { projectOptions } from "../checks";
import { FIELDS } from "@/lib/admin-fields";
import type { Project, Milestone } from "@/lib/types";

export default async function AdminMilestones() {
  const { supabase } = await requireAdmin();
  const [{ data: projectRows }, { data: milestoneRows }] = await Promise.all([
    supabase.from("projects").select("id, title").order("position"),
    supabase.from("project_milestones").select("*").order("position"),
  ]);
  const projects = (projectRows ?? []) as Pick<Project, "id" | "title">[];
  const milestones = (milestoneRows ?? []) as Milestone[];
  const options = projectOptions(projects);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Milestones"
        description="Dated moments shown as a timeline at the end of a case study. They appear as soon as they're saved."
      />
      <NewRowPanel table="project_milestones" fields={FIELDS.project_milestones} projects={options} action={saveRow} label="Add a milestone" />

      {projects.map((p) => {
        const mine = milestones.filter((m) => m.project_id === p.id);
        return (
          <section key={p.id} aria-labelledby={`p-${p.id}`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 id={`p-${p.id}`} className="text-[15px] font-semibold">{p.title} <span className="font-normal text-muted">· {mine.length}</span></h2>
              <Link href={`/admin/projects/${p.id}?tab=milestones`} className="text-[13px] text-accent hover:underline">Open project</Link>
            </div>
            {mine.length === 0 ? (
              <p className="mt-2 text-[13.5px] text-muted">No milestones yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {mine.map((m) => (
                  <li key={m.id} className="card rounded-xl p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14.5px] font-medium">{m.title}</span>
                      <span className="rounded-md bg-raised px-2 py-0.5 text-[12px] text-muted">{m.label}</span>
                      <span className="text-[13px] text-muted">{m.occurred_on ?? "No date"}</span>
                    </div>
                    <div className="mt-3 border-t border-line pt-3">
                      <RowActions table="project_milestones" row={m as unknown as Record<string, unknown>} fields={FIELDS.project_milestones} projects={options} action={saveRow} scope={{ col: "project_id", val: p.id }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
