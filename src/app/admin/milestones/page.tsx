import { requireAdmin } from "@/lib/auth";
import { saveRow } from "../actions";
import { NewRowPanel, RowActions, type Field } from "../ui";
import type { Project, Milestone } from "@/lib/types";

function fields(projects: Project[]): Field[] {
  return [
    { name: "project_id", label: "Project", type: "select", options: projects.map((p) => p.id) },
    { name: "title", label: "Title", type: "text" },
    { name: "label", label: "Label", type: "text", hint: "required — short tag, e.g. launch, incident, v2" },
    { name: "occurred_on", label: "Date", type: "date" },
    { name: "reference_url", label: "Reference URL", type: "url" },
    { name: "position", label: "Position", type: "number" },
    { name: "body_md", label: "Body", type: "markdown", rows: 6, hint: "markdown, optional" },
  ];
}

export default async function AdminMilestones() {
  const { supabase } = await requireAdmin();
  const [{ data: projectRows }, { data: milestoneRows }] = await Promise.all([
    supabase.from("projects").select("*").order("position"),
    supabase.from("project_milestones").select("*").order("position"),
  ]);

  const projects = (projectRows ?? []) as Project[];
  const milestones = (milestoneRows ?? []) as Milestone[];
  const F = fields(projects);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Milestones</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">
          {milestones.length} milestones across {projects.length} projects. No publish state — visible
          as soon as they exist, rendered as a dated timeline on the case study.
        </p>
      </div>

      <div className="card rounded-2xl p-5">
        <p className="text-[13px] text-muted">
          Project ids for the dropdown:{" "}
          {projects.map((p) => (
            <span key={p.id} className="mr-3 inline-block font-mono text-[11.5px] text-faint">
              {p.title} = {p.id.slice(0, 8)}…
            </span>
          ))}
        </p>
      </div>

      <NewRowPanel table="project_milestones" fields={F} action={saveRow} label="New milestone" />

      {projects.map((p) => {
        const mine = milestones.filter((m) => m.project_id === p.id);
        return (
          <section key={p.id}>
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-faint">
              {p.title} <span className="font-mono font-normal">{mine.length}</span>
            </h2>
            {mine.length === 0 ? (
              <p className="mt-2 text-[13px] text-faint">No milestones yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {mine.map((m) => (
                  <li key={m.id} className="card rounded-xl p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14.5px] font-medium">{m.title}</span>
                      <span className="rounded-md bg-raised px-2 py-0.5 font-mono text-[10.5px] uppercase text-muted">{m.label}</span>
                      <span className="font-mono text-[11px] text-faint">
                        {m.occurred_on ?? "no date"} · pos {m.position}
                      </span>
                    </div>
                    <div className="mt-3 border-t border-line pt-3">
                      <RowActions
                        table="project_milestones"
                        row={m as unknown as Record<string, unknown>}
                        fields={F}
                        action={saveRow}
                        states={[]}
                        scope={{ col: "project_id", val: p.id }}
                      />
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
