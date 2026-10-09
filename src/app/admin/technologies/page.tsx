import { requireAdmin } from "@/lib/auth";
import { saveRow } from "../actions";
import { NewRowPanel, RowActions, type Field } from "../ui";
import { TECH_GROUPS } from "@/lib/types";
import type { Technology } from "@/lib/types";

const FIELDS: Field[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "slug", label: "Slug", type: "text" },
  { name: "category", label: "Category", type: "select", options: TECH_GROUPS.map((g) => g.key) },
  { name: "color", label: "Accent colour", type: "text" },
  { name: "url", label: "Docs URL", type: "url" },
  { name: "position", label: "Position", type: "number" },
  { name: "summary_md", label: "Why I use it", type: "markdown", rows: 5, hint: "markdown" },
];

export default async function AdminTechnologies() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("technologies").select("*").order("category").order("position");
  const tech = (data ?? []) as Technology[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Technologies</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">{tech.length} rows. No publish state — these are always visible on /system.</p>
      </div>

      <NewRowPanel table="technologies" fields={FIELDS} action={saveRow} label="New technology" />

      {TECH_GROUPS.map((g) => {
        const items = tech.filter((t) => t.category === g.key);
        if (items.length === 0) return null;
        return (
          <section key={g.key}>
            <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-faint">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: g.accent }} />
              {g.label} <span className="font-mono font-normal">{items.length}</span>
            </h2>
            <ul className="mt-3 space-y-2">
              {items.map((t) => (
                <li key={t.id} className="card rounded-xl p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[14.5px] font-medium" style={{ color: t.color ?? undefined }}>{t.name}</span>
                    <span className="font-mono text-[11px] text-faint">{t.slug} · pos {t.position}</span>
                  </div>
                  <div className="mt-3 border-t border-line pt-3">
                    <RowActions
                      table="technologies"
                      row={t as unknown as Record<string, unknown>}
                      fields={FIELDS}
                      action={saveRow}
                      states={[]}
                      scope={{ col: "category", val: t.category }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
