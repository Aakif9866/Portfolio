import { requireAdmin } from "@/lib/auth";
import { saveRow } from "../actions";
import { NewRowPanel, RowActions, StateChip, type Field } from "../ui";
import type { TimelineEntry } from "@/lib/types";

const FIELDS: Field[] = [
  { name: "title", label: "Role / qualification", type: "text" },
  { name: "organisation", label: "Organisation", type: "text" },
  { name: "kind", label: "Kind", type: "select", options: ["work", "education"] },
  { name: "employment_type", label: "Employment type", type: "text", },
  { name: "location", label: "Location", type: "text" },
  { name: "start_date", label: "Start date", type: "date" },
  { name: "end_date", label: "End date", type: "date" },
  { name: "url", label: "Organisation URL", type: "url" },
  { name: "position", label: "Position", type: "number" },
  { name: "remote", label: "Remote", type: "checkbox" },
  { name: "bullets", label: "Bullets", type: "lines", rows: 6, hint: "one per line — only what actually happened" },
];

export default async function AdminExperience() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("timeline_entries").select("*").order("start_date", { ascending: false, nullsFirst: false });
  const rows = (data ?? []) as TimelineEntry[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Experience</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">
          {rows.length} rows. /experience is empty until something is published here — it does not
          invent placeholder roles.
        </p>
      </div>

      <NewRowPanel table="timeline_entries" fields={FIELDS} action={saveRow} label="New entry" />

      <ul className="space-y-3">
        {rows.map((e) => (
          <li key={e.id} className="card rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-semibold">{e.title}</h2>
              <StateChip state={e.state} />
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">{e.kind}</span>
            </div>
            <p className="mt-1 text-[13.5px] text-muted">
              {e.organisation}
              {e.start_date && <span className="text-faint"> · {e.start_date} → {e.end_date ?? "present"}</span>}
            </p>
            <div className="mt-4 border-t border-line pt-3.5">
              <RowActions table="timeline_entries" row={e as unknown as Record<string, unknown>} fields={FIELDS} action={saveRow} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
