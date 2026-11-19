import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { placeholders, type StoredResume } from "@/lib/resume";
import { AdminHeader } from "../ui";
import { WorkspaceError, fmtDate } from "../workspace-error";
import { NewVersion, StartMaster } from "./client";

/**
 * Resume builder: one master profile (drafted from the portfolio, edited once) and as many
 * versions as you like, each optionally tied to a job. Private: nothing here is public.
 */
export default async function Resumes() {
  const { supabase } = await requireAdmin();
  const [{ data, error }, jobs] = await Promise.all([
    supabase.from("private_config").select("key, value, updated_at").like("key", "resume.%").order("updated_at", { ascending: false }),
    supabase.from("entries").select("id, title").eq("kind", "job").order("updated_at", { ascending: false }).limit(200),
  ]);
  const rows = (data ?? []) as { key: string; value: StoredResume; updated_at: string }[];
  const master = rows.find((r) => r.key === "resume.master");
  const versions = rows.filter((r) => r.key.startsWith("resume.v."));
  const jobTitle = (id?: string) => (id ? jobs.data?.find((j) => j.id === id)?.title : undefined);

  return (
    <div className="space-y-6">
      <AdminHeader title="Resume" description="A master profile you fill in once, and versions for specific roles. Private; exported as PDF or .tex." />
      {error ? <WorkspaceError error={error} /> : (
        <>
          <section className="card space-y-3 rounded-2xl p-5" aria-labelledby="master-h">
            <h2 id="master-h" className="text-[15px] font-semibold">Master profile</h2>
            {master ? (
              <p className="flex flex-wrap items-baseline gap-x-3 text-[14px]">
                <Link href="/admin/resume/master" className="font-medium text-ink hover:text-accent">Open master profile</Link>
                <span className="text-[12.5px] text-faint">Updated {fmtDate(master.updated_at)}{placeholders(master.value.text).length ? ` · ${placeholders(master.value.text).length} things to fill in` : ""}</span>
              </p>
            ) : (
              <>
                <p className="text-[13.5px] text-muted">Starts from your published projects, experience and tech stack. Anything the portfolio doesn&apos;t know (your full name, phone, education) is left as a highlighted [placeholder]; nothing is made up.</p>
                <StartMaster />
              </>
            )}
          </section>

          {master && (
            <section className="space-y-3" aria-labelledby="versions-h">
              <h2 id="versions-h" className="text-[15px] font-semibold">Versions</h2>
              <NewVersion jobs={jobs.data ?? []} />
              {versions.length === 0 ? <p className="text-[13.5px] text-muted">No versions yet. Make one per kind of role, or per application.</p> : (
                <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
                  {versions.map((v) => (
                    <li key={v.key} className="flex flex-wrap items-baseline gap-x-3 px-4 py-3">
                      <Link href={`/admin/resume/${v.key.slice("resume.".length)}`} className="text-[14.5px] font-medium text-ink hover:text-accent">{v.value.title}</Link>
                      {jobTitle(v.value.job_id) && <span className="text-[12.5px] text-muted">for {jobTitle(v.value.job_id)}</span>}
                      <span className="ml-auto text-[12px] text-faint">{fmtDate(v.updated_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
