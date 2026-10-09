import { requireAdmin } from "@/lib/auth";
import { saveRow } from "../actions";
import { NewRowPanel, RowActions, StateChip, type Field } from "../ui";
import { SECTION_ORDER, SECTION_LABEL } from "@/lib/types";
import type { Project, ProjectSection } from "@/lib/types";

function fields(projects: Project[]): Field[] {
  return [
    { name: "project_id", label: "Project", type: "select", options: projects.map((p) => p.id) },
    { name: "kind", label: "Section", type: "select", options: SECTION_ORDER },
    { name: "heading", label: "Custom heading", type: "text" },
    { name: "position", label: "Position", type: "number" },
    { name: "body_md", label: "Body", type: "markdown", rows: 16, hint: "markdown — headings, lists, code fences, tables" },
  ];
}

export default async function AdminSections() {
  const { supabase } = await requireAdmin();
  const [{ data: projectRows }, { data: sectionRows }] = await Promise.all([
    supabase.from("projects").select("*").order("position"),
    supabase.from("project_sections").select("*").order("position"),
  ]);

  const projects = (projectRows ?? []) as Project[];
  const sections = (sectionRows ?? []) as ProjectSection[];
  const title = Object.fromEntries(projects.map((p) => [p.id, p.title]));
  const F = fields(projects);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Case study sections</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">
          {sections.length} sections across {projects.length} projects. Only{" "}
          <span className="font-mono">published</span> sections render, and they render in canonical
          order regardless of insert order.
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

      <NewRowPanel table="project_sections" fields={F} action={saveRow} label="New section" />

      {projects.map((p) => {
        const mine = sections
          .filter((s) => s.project_id === p.id)
          .sort((a, b) => SECTION_ORDER.indexOf(a.kind as never) - SECTION_ORDER.indexOf(b.kind as never));
        return (
          <section key={p.id}>
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-faint">
              {p.title} <span className="font-mono font-normal">{mine.length}</span>
            </h2>
            {mine.length === 0 ? (
              <p className="mt-2 text-[13px] text-faint">No sections — this case study renders only its header.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {mine.map((s) => (
                  <li key={s.id} className="card rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[14.5px] font-medium">{s.heading ?? SECTION_LABEL[s.kind] ?? s.kind}</span>
                      <StateChip state={s.state} />
                      <span className="font-mono text-[11px] text-faint">{s.kind} · pos {s.position}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 font-mono text-[11.5px] leading-relaxed text-faint">
                      {s.body_md?.slice(0, 180) ?? "empty"}
                    </p>
                    <div className="mt-3 border-t border-line pt-3">
                      <RowActions
                        table="project_sections"
                        row={{ ...s, title: s.heading ?? s.kind } as unknown as Record<string, unknown>}
                        fields={F}
                        action={saveRow}
                        states={["draft", "published", "hidden"]}
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
