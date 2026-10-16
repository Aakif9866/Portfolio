import { requireAdmin } from "@/lib/auth";
import { saveRow } from "../actions";
import { AdminHeader, ListFilter, NewRowPanel, RowActions, StateChip } from "../ui";
import { FIELDS } from "@/lib/admin-fields";
import type { TimelineEntry } from "@/lib/types";

const fmt = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : null);

export default async function AdminExperience({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; new?: string }> }) {
  const { q, status, new: isNew } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("timeline_entries").select("*").order("start_date", { ascending: false, nullsFirst: false });
  const all = (data ?? []) as TimelineEntry[];
  const needle = q?.trim().toLowerCase();
  const rows = all.filter((e) => (!status || e.state === status) && (!needle || `${e.title} ${e.organisation}`.toLowerCase().includes(needle)));

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Experience"
        description="Work history and education, shown on the Experience page newest first. Only what actually happened — personal projects belong under Projects."
      />

      <NewRowPanel table="timeline_entries" fields={FIELDS.timeline_entries} action={saveRow} label="Add work or education" defaultOpen={isNew === "1"} />
      <ListFilter q={q} status={status} statuses={["published", "draft", "archived"]} />

      {rows.length === 0 ? (
        <p className="card rounded-2xl px-6 py-10 text-center text-[14px] text-muted">
          {all.length === 0 ? "Nothing yet. The public Experience page shows a friendly empty state until an entry is published." : "No entries match this filter."}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((e) => (
            <li key={e.id} className="card rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[16px] font-semibold">{e.title}</h2>
                <StateChip state={e.state} />
                <span className="rounded-full bg-raised px-2 py-0.5 text-[12px] text-muted">{e.kind === "education" ? "Education" : "Work"}</span>
              </div>
              <p className="mt-1.5 text-[14px] text-muted">
                {e.organisation}
                {e.start_date && <> · {fmt(e.start_date)} – {fmt(e.end_date) ?? "present"}</>}
              </p>
              <div className="mt-4 border-t border-line pt-3.5">
                <RowActions table="timeline_entries" row={e as unknown as Record<string, unknown>} fields={FIELDS.timeline_entries} action={saveRow} reorderable={false} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
