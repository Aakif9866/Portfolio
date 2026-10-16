import { requireAdmin } from "@/lib/auth";
import { saveRow } from "../actions";
import { AdminHeader, BTN, ListFilter, NewRowPanel, RowActions, StateChip } from "../ui";
import { FIELDS } from "@/lib/admin-fields";
import { EXPERIMENT_STATUS, statusLabel } from "@/lib/labels";
import type { Experiment } from "@/lib/types";

export default async function AdminExperiments({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; new?: string }> }) {
  const { q, status, new: isNew } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("experiments").select("*").order("position");
  const all = (data ?? []) as Experiment[];
  const needle = q?.trim().toLowerCase();
  const rows = all.filter((e) => (!status || e.state === status) && (!needle || e.title.toLowerCase().includes(needle)));

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Experiments"
        description="Smaller tests shown under Experiments. The outcome (succeeded, failed…) is separate from whether it's published — failed experiments can and should stay published."
      />

      <NewRowPanel table="experiments" fields={FIELDS.experiments} action={saveRow} label="Add an experiment" defaultOpen={isNew === "1"} />
      <ListFilter q={q} status={status} statuses={["published", "draft", "archived"]} />

      {rows.length === 0 ? (
        <p className="card rounded-2xl px-6 py-10 text-center text-[14px] text-muted">{all.length === 0 ? "No experiments yet." : "No experiments match this filter."}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((e) => (
            <li key={e.id} className="card rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[16px] font-semibold">{e.title}</h2>
                <StateChip state={e.state} />
                <span className="rounded-full bg-raised px-2 py-0.5 text-[12px] text-muted">Outcome: {statusLabel(EXPERIMENT_STATUS, e.status)}</span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-muted">{e.summary}</p>
              <div className="mt-4 border-t border-line pt-3.5">
                <RowActions
                  table="experiments"
                  row={e as unknown as Record<string, unknown>}
                  fields={FIELDS.experiments}
                  action={saveRow}
                  extra={e.state === "published" ? <a href={`/lab/${e.slug}`} target="_blank" rel="noopener" className={BTN.quiet}>View live ↗</a> : null}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
