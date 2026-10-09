import { requireAdmin } from "@/lib/auth";
import { saveRow } from "../actions";
import { NewRowPanel, RowActions, StateChip, type Field } from "../ui";
import type { Experiment } from "@/lib/types";

const FIELDS: Field[] = [
  { name: "title", label: "Title", type: "text" },
  { name: "slug", label: "Slug", type: "text" },
  { name: "status", label: "Status", type: "select", options: ["running", "paused", "success", "failed", "abandoned"] },
  { name: "position", label: "Position", type: "number" },
  { name: "started_on", label: "Started", type: "date" },
  { name: "ended_on", label: "Ended", type: "date" },
  { name: "summary", label: "Summary", type: "textarea", rows: 3 },
  { name: "tags", label: "Tags", type: "lines", rows: 3, hint: "one per line" },
  { name: "hypothesis_md", label: "Hypothesis", type: "markdown", rows: 8, hint: "markdown — write this before the outcome" },
  { name: "outcome_md", label: "Outcome", type: "markdown", rows: 8, hint: "markdown — leave empty while running" },
];

export default async function AdminLab() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("experiments").select("*").order("position");
  const rows = (data ?? []) as Experiment[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Experiments</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">{rows.length} rows. Failed and abandoned experiments can stay published.</p>
      </div>

      <NewRowPanel table="experiments" fields={FIELDS} action={saveRow} label="New experiment" />

      <ul className="space-y-3">
        {rows.map((e) => (
          <li key={e.id} className="card rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-semibold">{e.title}</h2>
              <StateChip state={e.state} />
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">{e.status}</span>
            </div>
            <p className="mt-1 font-mono text-[11.5px] text-faint">/lab/{e.slug} · pos {e.position}</p>
            <p className="mt-2.5 line-clamp-2 text-[13.5px] leading-relaxed text-muted">{e.summary}</p>
            <div className="mt-4 border-t border-line pt-3.5">
              <RowActions table="experiments" row={e as unknown as Record<string, unknown>} fields={FIELDS} action={saveRow} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
