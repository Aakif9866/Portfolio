import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { weekLabel, weekOf, type Entry, type StatusChange } from "@/lib/entries";
import { ENTRY_STATUS } from "@/lib/labels";
import { AdminHeader, BTN } from "../ui";
import { WorkspaceError } from "../workspace-error";

/**
 * Weekly recap: what you logged, saved, finished and decided in one week (Monday–Sunday,
 * IST). Built from your entries when you open it; nothing is scheduled or sent anywhere.
 */
export default async function Recap({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const { supabase } = await requireAdmin();
  const { w } = await searchParams;
  const monday = weekOf(w && /^\d{4}-\d{2}-\d{2}$/.test(w) && !Number.isNaN(Date.parse(w)) ? `${w}T12:00:00+05:30` : new Date());
  const shift = (days: number) => {
    const d = new Date(`${monday}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const start = `${monday}T00:00:00+05:30`;
  const end = `${shift(7)}T00:00:00+05:30`;
  const isCurrent = monday === weekOf(new Date());

  // Timestamps contain ":" and ".", which are reserved inside or(); quoting keeps them as values.
  const inWeek = (col: string) => `and(${col}.gte."${start}",${col}.lt."${end}")`;
  const { data, error } = await supabase.from("entries").select("*")
    .or(`${inWeek("created_at")},${inWeek("updated_at")}`)
    .order("created_at", { ascending: true });
  const rows = (data ?? []) as Entry[];
  const [from, to] = [Date.parse(start), Date.parse(end)];
  const created = (e: Entry) => { const t = Date.parse(e.created_at); return t >= from && t < to; };

  // Jobs keep a status history, so their recap line is exact: the last change made this week.
  const changesInWeek = (e: Entry) =>
    (Array.isArray(e.meta?.history) ? (e.meta.history as StatusChange[]) : []).filter((h) => { const t = Date.parse(h.at); return t >= from && t < to; });
  // ponytail: "achieved" and "done" count if the entry was touched this week; there is no status-changed-at
  // column. Add one if a goal edited long after it was achieved shows up as noise.
  const groups: { title: string; items: Entry[] }[] = [
    { title: "Logged", items: rows.filter((e) => e.kind === "log" && created(e)) },
    { title: "Goals achieved", items: rows.filter((e) => e.kind === "goal" && e.status === "achieved") },
    { title: "Finished reading", items: rows.filter((e) => e.kind === "link" && e.status === "done") },
    { title: "Saved resources", items: rows.filter((e) => e.kind === "link" && created(e)) },
    { title: "New ideas", items: rows.filter((e) => e.kind === "idea" && created(e)) },
    { title: "Jobs", items: rows.filter((e) => e.kind === "job" && (created(e) || changesInWeek(e).length > 0)) },
    { title: "Notes", items: rows.filter((e) => e.kind === "note" && created(e)) },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Weekly recap"
        description={weekLabel(monday)}
        actions={
          <>
            <Link href={`/admin/recap?w=${shift(-7)}`} className={BTN.secondary}>← Previous week</Link>
            {!isCurrent && <Link href={`/admin/recap?w=${shift(7)}`} className={BTN.secondary}>Next week →</Link>}
          </>
        }
      />
      {error ? <WorkspaceError error={error} /> : groups.length === 0 ? (
        <p className="card rounded-2xl px-6 py-12 text-center text-[14px] text-muted">
          Nothing captured {isCurrent ? "this week yet" : "that week"}. That&apos;s fine — this is a record, not a scorecard.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <section key={g.title} className="card rounded-2xl p-4">
              <h2 className="mb-2 flex items-baseline justify-between text-[14px] font-semibold">
                {g.title} <span className="font-normal text-faint">{g.items.length}</span>
              </h2>
              <ul className="space-y-1.5">
                {g.items.map((e) => (
                  <li key={e.id} className="text-[13.5px]">
                    <Link href={`/admin?e=${e.id}`} className="text-ink hover:text-accent">{e.title || e.url}</Link>
                    {e.kind === "job" && changesInWeek(e).length > 0 && <span className="ml-1.5 text-faint">→ {ENTRY_STATUS.job[changesInWeek(e).at(-1)!.status ?? ""]?.label ?? "no status"}</span>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
