import { requireAdmin } from "@/lib/auth";
import { saveRow } from "../actions";
import { NewRowPanel, RowActions, type Field } from "../ui";
import type { Project, Diagram } from "@/lib/types";

function fields(projects: Project[]): Field[] {
  return [
    { name: "project_id", label: "Project", type: "select", options: projects.map((p) => p.id) },
    { name: "title", label: "Title", type: "text" },
    { name: "description", label: "Description", type: "textarea", rows: 2 },
    { name: "image_url", label: "Image URL", type: "url", hint: "a hosted screenshot of the diagram — works standalone, or above the graph below" },
    { name: "position", label: "Position", type: "number" },
    { name: "nodes", label: "Nodes (JSON)", type: "json", rows: 8, hint: '[{"id":"api","label":"API","tech":"Node.js","x":0,"y":0,"explanation":"..."}]' },
    { name: "edges", label: "Edges (JSON)", type: "json", rows: 5, hint: '[{"from":"api","to":"db","label":"writes"}]' },
  ];
}

export default async function AdminDiagrams() {
  const { supabase } = await requireAdmin();
  const [{ data: projectRows }, { data: diagramRows }] = await Promise.all([
    supabase.from("projects").select("*").order("position"),
    supabase.from("architecture_diagrams").select("*").order("position"),
  ]);

  const projects = (projectRows ?? []) as Project[];
  const diagrams = (diagramRows ?? []) as Diagram[];
  const F = fields(projects);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Architecture diagrams</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">
          {diagrams.length} diagrams across {projects.length} projects. No publish state — visible as
          soon as they exist. An image alone is enough; nodes/edges are only for the interactive graph.
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

      <NewRowPanel table="architecture_diagrams" fields={F} action={saveRow} label="New diagram" />

      {projects.map((p) => {
        const mine = diagrams.filter((d) => d.project_id === p.id);
        return (
          <section key={p.id}>
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-faint">
              {p.title} <span className="font-mono font-normal">{mine.length}</span>
            </h2>
            {mine.length === 0 ? (
              <p className="mt-2 text-[13px] text-faint">No diagram yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {mine.map((d) => (
                  <li key={d.id} className="card rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[14.5px] font-medium">{d.title}</span>
                      <span className="font-mono text-[11px] text-faint">
                        pos {d.position} · {d.nodes?.length ?? 0} nodes{d.image_url ? " · image" : ""}
                      </span>
                    </div>
                    {d.description && <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-faint">{d.description}</p>}
                    <div className="mt-3 border-t border-line pt-3">
                      <RowActions
                        table="architecture_diagrams"
                        row={d as unknown as Record<string, unknown>}
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
