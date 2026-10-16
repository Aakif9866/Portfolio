import { requireAdmin } from "@/lib/auth";
import { saveRow } from "../actions";
import { AdminHeader, NewRowPanel, RowActions } from "../ui";
import { FIELDS } from "@/lib/admin-fields";
import { TECH_GROUPS } from "@/lib/types";
import type { Technology } from "@/lib/types";

export default async function AdminTechnologies({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data }, { data: links }] = await Promise.all([
    supabase.from("technologies").select("*").order("category").order("position"),
    supabase.from("project_technologies").select("technology_id"),
  ]);
  const needle = q?.trim().toLowerCase();
  const tech = ((data ?? []) as Technology[]).filter((t) => !needle || t.name.toLowerCase().includes(needle));
  const uses = (id: string) => ((links ?? []) as { technology_id: string }[]).filter((l) => l.technology_id === id).length;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Technologies"
        description="Everything listed on the Tech Stack page, by category. Always public. Tag a technology onto a project from the project's Technologies tab."
      />
      <NewRowPanel table="technologies" fields={FIELDS.technologies} action={saveRow} label="Add a technology" />

      <form role="search" className="flex gap-2">
        <label htmlFor="tech-q" className="sr-only">Search technologies</label>
        <input id="tech-q" name="q" defaultValue={q} placeholder="Search technologies…" className="w-64 rounded-lg border border-line bg-surface px-3 py-2 text-[14px] outline-none focus:border-accent" />
      </form>

      {TECH_GROUPS.map((g) => {
        const items = tech.filter((t) => t.category === g.key);
        if (items.length === 0) return null;
        return (
          <section key={g.key} aria-labelledby={`g-${g.key}`}>
            <h2 id={`g-${g.key}`} className="flex items-center gap-2 text-[15px] font-semibold">
              <span className="h-2 w-2 rounded-full" style={{ background: g.accent }} />
              {g.label} <span className="font-normal text-muted">· {items.length}</span>
            </h2>
            <ul className="mt-3 space-y-2">
              {items.map((t) => (
                <li key={t.id} className="card rounded-xl p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[14.5px] font-medium">{t.name}</span>
                    <span className="text-[13px] text-muted">{uses(t.id) ? `Used in ${uses(t.id)} project${uses(t.id) === 1 ? "" : "s"}` : "Not used in any project yet"}</span>
                  </div>
                  <div className="mt-3 border-t border-line pt-3">
                    <RowActions
                      table="technologies"
                      row={t as unknown as Record<string, unknown>}
                      fields={FIELDS.technologies}
                      action={saveRow}
                      scope={{ col: "category", val: t.category }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {tech.length === 0 && <p className="card rounded-2xl px-6 py-10 text-center text-[14px] text-muted">No technologies match.</p>}
    </div>
  );
}
