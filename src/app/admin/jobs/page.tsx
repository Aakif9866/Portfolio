import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { daysSince, type Entry } from "@/lib/entries";
import { ENTRY_STATUS } from "@/lib/labels";
import { AdminHeader } from "../ui";
import { StatusPicker } from "../workspace-ui";
import { WorkspaceError, fmtDate } from "../workspace-error";
import { AddJob } from "./add-job";

/**
 * Job tracker: a board of active applications (Saved → Applied → Interviewing → Offer) and a
 * list of everything, closed ones included. Follow-up dates are optional and only ever show
 * up here and on the Inbox, never as notifications.
 */
const ACTIVE = ["saved", "applied", "interviewing", "offer"];
const CLOSED = ["rejected", "closed"];

type Job = Entry & { company?: string; role?: string; location?: string; applied_on?: string };
const asJob = (e: Entry): Job => ({ ...e, ...(e.meta as object) });
const str = (v: unknown) => (typeof v === "string" ? v : undefined);

export default async function Jobs({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { supabase } = await requireAdmin();
  const { view } = await searchParams;
  const { data, error } = await supabase.from("entries").select("*").eq("kind", "job").order("updated_at", { ascending: false }).limit(500);
  const jobs = ((data ?? []) as Entry[]).map(asJob);
  const followUps = jobs.filter((j) => j.due_on && daysSince(j.due_on) >= 0 && !CLOSED.includes(j.status ?? ""));
  const tab = (active: boolean) =>
    `rounded-full border px-3 py-1 text-[12.5px] transition-colors ${active ? "border-ink bg-ink text-page" : "border-line text-muted hover:border-line-strong hover:text-ink"}`;

  return (
    <div className="space-y-6">
      <AdminHeader title="Jobs" description={<>Opportunities and applications. Add one below, or type <code className="font-mono text-[12.5px]">job: &lt;link&gt;</code> in the capture box.</>} />
      <AddJob />

      {error ? <WorkspaceError error={error} /> : jobs.length === 0 ? (
        <p className="card rounded-2xl px-6 py-12 text-center text-[14px] text-muted">No jobs yet. Save one you&apos;re interested in, even before applying.</p>
      ) : (
        <>
          {followUps.length > 0 && (
            <section className="card rounded-2xl p-4" aria-labelledby="followups">
              <h2 id="followups" className="mb-2 text-[14px] font-semibold">Follow-ups due · {followUps.length}</h2>
              <ul className="space-y-1.5">
                {followUps.map((j) => (
                  <li key={j.id} className="flex flex-wrap items-baseline gap-x-2 text-[13.5px]">
                    <Link href={`/admin?e=${j.id}`} className="text-ink hover:text-accent">{j.title || j.url}</Link>
                    <span className="text-faint">{daysSince(j.due_on!) === 0 ? "today" : `${daysSince(j.due_on!)} days overdue`}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <nav aria-label="View" className="flex gap-1.5">
            <Link href="/admin/jobs" aria-current={view !== "list" ? "page" : undefined} className={tab(view !== "list")}>Board</Link>
            <Link href="/admin/jobs?view=list" aria-current={view === "list" ? "page" : undefined} className={tab(view === "list")}>All jobs · {jobs.length}</Link>
          </nav>

          {view === "list" ? <JobTable jobs={jobs} /> : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {ACTIVE.map((col) => {
                const cards = jobs.filter((j) => (j.status ?? "saved") === col);
                return (
                  <section key={col} aria-labelledby={`job-${col}`} className="rounded-2xl border border-line bg-surface p-3">
                    <h2 id={`job-${col}`} className="mb-3 flex items-baseline justify-between px-1 text-[13.5px] font-semibold">
                      {ENTRY_STATUS.job[col].label} <span className="font-normal text-faint">{cards.length}</span>
                    </h2>
                    <ul className="space-y-2.5">{cards.map((j) => <JobCard key={j.id} j={j} col={col} />)}</ul>
                  </section>
                );
              })}
            </div>
          )}
          {view !== "list" && jobs.some((j) => CLOSED.includes(j.status ?? "")) && (
            <p className="text-[12.5px] text-faint">Rejected and closed jobs are under <Link href="/admin/jobs?view=list" className="underline underline-offset-2">All jobs</Link>.</p>
          )}
        </>
      )}
    </div>
  );
}

function JobCard({ j, col }: { j: Job; col: string }) {
  const company = str(j.company);
  const role = str(j.role);
  const applied = str(j.applied_on);
  const overdue = j.due_on && daysSince(j.due_on) >= 0;
  return (
    <li className="card rounded-xl p-3">
      <Link href={`/admin?e=${j.id}`} className="block text-[14px] font-medium text-ink hover:text-accent">{role || j.title || j.url}</Link>
      {company && role && <p className="text-[13px] text-muted">{company}</p>}
      <p className="mt-1 flex flex-wrap gap-x-2 text-[11.5px] text-faint">
        {str(j.location) && <span>{j.location}</span>}
        {applied && <span>Applied {fmtDate(applied)}</span>}
        {j.due_on && <span className={overdue ? "font-medium text-ink" : ""}>Follow up {fmtDate(j.due_on)}</span>}
      </p>
      {j.url && <a href={j.url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-[12px] text-muted underline-offset-2 hover:underline">Posting ↗</a>}
      <div className="mt-2.5">
        <StatusPicker id={j.id} kind="job" status={j.status ?? "saved"} only={[...ACTIVE, ...CLOSED].filter((s) => s !== col)} />
      </div>
    </li>
  );
}

function JobTable({ jobs }: { jobs: Job[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-card">
      <table className="w-full min-w-[640px] text-left text-[13.5px]">
        <thead className="border-b border-line text-[12px] text-faint">
          <tr><th className="px-4 py-2 font-medium">Role</th><th className="px-4 py-2 font-medium">Company</th><th className="px-4 py-2 font-medium">Status</th><th className="px-4 py-2 font-medium">Applied</th><th className="px-4 py-2 font-medium">Follow up</th><th className="px-4 py-2 font-medium">Updated</th></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {jobs.map((j) => (
            <tr key={j.id}>
              <td className="px-4 py-2.5"><Link href={`/admin?e=${j.id}`} className="font-medium text-ink hover:text-accent">{str(j.role) || j.title || j.url}</Link></td>
              <td className="px-4 py-2.5 text-muted">{str(j.company) ?? "—"}</td>
              <td className="px-4 py-2.5">{ENTRY_STATUS.job[j.status ?? "saved"]?.label ?? j.status}</td>
              <td className="px-4 py-2.5 text-muted">{str(j.applied_on) ? fmtDate(j.applied_on!) : "—"}</td>
              <td className="px-4 py-2.5 text-muted">{j.due_on ? fmtDate(j.due_on) : "—"}</td>
              <td className="px-4 py-2.5 text-faint">{fmtDate(j.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
