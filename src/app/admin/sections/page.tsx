import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { saveRow } from "../actions";
import { AdminHeader, NewRowPanel, RowActions, StateChip } from "../ui";
import { projectOptions } from "../checks";
import { FIELDS } from "@/lib/admin-fields";
import { SECTION_ORDER, SECTION_LABEL } from "@/lib/types";
import type { Project, ProjectSection } from "@/lib/types";

export default async function AdminSections() {
  const { supabase } = await requireAdmin();
  const [{ data: projectRows }, { data: sectionRows }] = await Promise.all([
    supabase.from("projects").select("id, title").order("position"),
    supabase.from("project_sections").select("*").order("position"),
  ]);
  const projects = (projectRows ?? []) as Pick<Project, "id" | "title">[];
  const sections = (sectionRows ?? []) as ProjectSection[];
  const options = projectOptions(projects);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Case-study sections"
        description="Every project's write-up sections in one place. It's usually easier to edit them inside a project — use “Open project”."
      />
      <NewRowPanel table="project_sections" fields={FIELDS.project_sections} projects={options} action={saveRow} label="Add a section" />

      {projects.map((p) => {
        const mine = sections
          .filter((s) => s.project_id === p.id)
          .sort((a, b) => SECTION_ORDER.indexOf(a.kind as never) - SECTION_ORDER.indexOf(b.kind as never));
        return (
          <section key={p.id} aria-labelledby={`p-${p.id}`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 id={`p-${p.id}`} className="text-[15px] font-semibold">{p.title} <span className="font-normal text-muted">· {mine.length}</span></h2>
              <Link href={`/admin/projects/${p.id}?tab=case-study`} className="text-[13px] text-accent hover:underline">Open project</Link>
            </div>
            {mine.length === 0 ? (
              <p className="mt-2 text-[13.5px] text-muted">No sections yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {mine.map((s) => (
                  <li key={s.id} className="card rounded-xl p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14.5px] font-medium">{s.heading ?? SECTION_LABEL[s.kind] ?? s.kind}</span>
                      <StateChip state={s.state} />
                    </div>
                    <p className="mt-1.5 line-clamp-1 text-[13px] text-muted">{s.body_md?.trim() || "No content yet."}</p>
                    <div className="mt-3 border-t border-line pt-3">
                      <RowActions
                        table="project_sections"
                        row={{ ...s, title: s.heading ?? SECTION_LABEL[s.kind] } as unknown as Record<string, unknown>}
                        fields={FIELDS.project_sections}
                        projects={options}
                        action={saveRow}
                        scope={{ col: "project_id", val: p.id }}
                        reorderable={false}
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
