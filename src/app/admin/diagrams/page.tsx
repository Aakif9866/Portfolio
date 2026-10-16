import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { saveRow } from "../actions";
import { AdminHeader, NewRowPanel, RowActions } from "../ui";
import { projectOptions } from "../checks";
import { FIELDS } from "@/lib/admin-fields";
import type { Project, Diagram } from "@/lib/types";

export default async function AdminDiagrams() {
  const { supabase } = await requireAdmin();
  const [{ data: projectRows }, { data: diagramRows }] = await Promise.all([
    supabase.from("projects").select("id, title").order("position"),
    supabase.from("architecture_diagrams").select("*").order("position"),
  ]);
  const projects = (projectRows ?? []) as Pick<Project, "id" | "title">[];
  const diagrams = (diagramRows ?? []) as Diagram[];
  const options = projectOptions(projects);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Architecture diagrams"
        description="Diagrams shown under a case study's Architecture section. They appear as soon as they're saved. A screenshot link is enough; the interactive boxes are optional."
      />
      <NewRowPanel table="architecture_diagrams" fields={FIELDS.architecture_diagrams} projects={options} action={saveRow} label="Add a diagram" />

      {projects.map((p) => {
        const mine = diagrams.filter((d) => d.project_id === p.id);
        return (
          <section key={p.id} aria-labelledby={`p-${p.id}`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 id={`p-${p.id}`} className="text-[15px] font-semibold">{p.title} <span className="font-normal text-muted">· {mine.length}</span></h2>
              <Link href={`/admin/projects/${p.id}?tab=architecture`} className="text-[13px] text-accent hover:underline">Open project</Link>
            </div>
            {mine.length === 0 ? (
              <p className="mt-2 text-[13.5px] text-muted">No diagram yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {mine.map((d) => (
                  <li key={d.id} className="card rounded-xl p-4">
                    <p className="text-[14.5px] font-medium">{d.title}</p>
                    <p className="mt-1 text-[13px] text-muted">
                      {[d.image_url && "Image", (d.nodes?.length ?? 0) > 0 && `${d.nodes.length} interactive boxes`].filter(Boolean).join(" · ") || "Empty — add an image link or boxes"}
                    </p>
                    <div className="mt-3 border-t border-line pt-3">
                      <RowActions table="architecture_diagrams" row={d as unknown as Record<string, unknown>} fields={FIELDS.architecture_diagrams} projects={options} action={saveRow} scope={{ col: "project_id", val: p.id }} />
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
