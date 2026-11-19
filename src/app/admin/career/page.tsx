import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { CAREER_KEY, SKILLS_KEY, SKILL_LEVELS, checklist, tasks, type Career, type Skills } from "@/lib/career";
import { daysSince, type Entry } from "@/lib/entries";
import { AdminHeader } from "../ui";
import { StatusPicker } from "../workspace-ui";
import { WorkspaceError, fmtDate } from "../workspace-error";
import { CareerForm, Milestones } from "./client";

/**
 * Career (strictly private): where you are, where you want to be, and the goals in between.
 * Goals are ordinary entries (`goal: …` in the capture box). Milestones are `- [ ]` lines in a
 * goal's notes and can be ticked here. A goal connects to resources and logs through shared
 * tags, so there's nothing extra to maintain.
 */
const AREAS = ["backend", "system-design", "ai-ml", "frontend", "devops", "research"];

export default async function CareerPage() {
  const { supabase } = await requireAdmin();
  const [goalsRes, tagged, config] = await Promise.all([
    supabase.from("entries").select("*").eq("kind", "goal").order("due_on", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false }),
    supabase.from("entries").select("kind, tags, created_at").in("kind", ["link", "log"]),
    supabase.from("private_config").select("key, value").in("key", [CAREER_KEY, SKILLS_KEY]),
  ]);
  const error = goalsRes.error ?? tagged.error ?? config.error;
  const goals = (goalsRes.data ?? []) as Entry[];
  const career = (config.data?.find((r) => r.key === CAREER_KEY)?.value ?? {}) as Career;
  const skills = (config.data?.find((r) => r.key === SKILLS_KEY)?.value ?? {}) as Skills;

  const open = goals.filter((g) => !g.status || g.status === "open");
  const closed = goals.filter((g) => g.status === "achieved" || g.status === "dropped");
  const related = (tags: string[], kind: string) => (tagged.data ?? []).filter((e) => e.kind === kind && e.tags?.some((t: string) => tags.includes(t))).length;

  const monthAgo = Date.now() - 30 * 864e5;
  const recentLogs = (tagged.data ?? []).filter((e) => e.kind === "log" && Date.parse(e.created_at) >= monthAgo);
  const byArea = AREAS.map((a) => ({ area: a, n: recentLogs.filter((l) => l.tags?.includes(a)).length })).filter((x) => x.n > 0);
  const levels = Object.keys(SKILL_LEVELS).map((k) => ({ k, n: Object.values(skills).filter((s) => s.level === k).length }));
  const wants = Object.entries(skills).filter(([, s]) => s.want).map(([name]) => name);

  return (
    <div className="space-y-8">
      <AdminHeader title="Career" description="Private. Nothing on this page is ever shown on the public site or sent anywhere." />
      {error ? <WorkspaceError error={error} /> : (
        <>
          <section aria-label="At a glance" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Now → target" value={career.current_salary || career.target_salary ? `${career.current_salary ?? "?"} → ${career.target_salary ?? "?"}` : "Not set"} />
            <Stat label="Goals" value={`${open.length} open · ${goals.filter((g) => g.status === "achieved").length} achieved`} />
            <Stat label="Skills" value={levels.some((l) => l.n) ? levels.filter((l) => l.n).map((l) => `${l.n} ${SKILL_LEVELS[l.k].toLowerCase()}`).join(" · ") : "None rated"} href="/admin/skills" />
            <Stat label="Logs, last 30 days" value={recentLogs.length ? `${recentLogs.length}${byArea.length ? ` · ${byArea.map((a) => `${a.n} ${a.area}`).join(", ")}` : ""}` : "None"} href="/admin/logs" />
          </section>
          {wants.length > 0 && (
            <p className="text-[13.5px] text-muted">
              Want to learn: {wants.map((w, i) => <span key={w}>{i > 0 && ", "}<Link href="/admin/skills" className="text-ink hover:text-accent">{w}</Link></span>)}
            </p>
          )}

          <section aria-labelledby="goals-h" className="space-y-3">
            <h2 id="goals-h" className="text-[15px] font-semibold">Goals</h2>
            {open.length === 0 ? (
              <p className="card rounded-2xl px-5 py-8 text-center text-[13.5px] text-muted">
                No open goals. Type <code className="font-mono">goal: crack a backend role at 10 LPA #backend</code> in the box above. Add <code className="font-mono">- [ ] step</code> lines to its notes for milestones.
              </p>
            ) : (
              <ul className="grid gap-3 lg:grid-cols-2">{open.map((g) => <GoalCard key={g.id} g={g} related={related} />)}</ul>
            )}
            {closed.length > 0 && (
              <details className="rounded-2xl border border-line p-4">
                <summary className="cursor-pointer text-[13.5px] font-medium text-muted">Achieved and dropped · {closed.length}</summary>
                <ul className="mt-3 space-y-1.5">
                  {closed.map((g) => (
                    <li key={g.id} className="flex flex-wrap items-baseline gap-x-2 text-[13.5px]">
                      <Link href={`/admin?e=${g.id}`} className="text-ink hover:text-accent">{g.title}</Link>
                      <span className="text-faint">{g.status === "achieved" ? "Achieved" : "Dropped"} · {fmtDate(g.updated_at)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          <section aria-labelledby="profile-h" className="card space-y-3 rounded-2xl p-5">
            <h2 id="profile-h" className="text-[15px] font-semibold">Profile</h2>
            <p className="text-[13px] text-muted">Every field is optional. Fill in what helps you think; leave the rest.</p>
            <CareerForm career={career} />
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <>
      <span className="block text-[12px] text-muted">{label}</span>
      <span className="mt-0.5 block text-[15px] font-semibold leading-snug">{value}</span>
    </>
  );
  return href ? <Link href={href} className="card card-hover rounded-xl px-4 py-3">{body}</Link> : <div className="card rounded-xl px-4 py-3">{body}</div>;
}

function GoalCard({ g, related }: { g: Entry; related: (tags: string[], kind: string) => number }) {
  const { done, total } = checklist(g.body_md);
  const days = g.due_on ? daysSince(g.due_on) : null;
  const res = g.tags.length ? related(g.tags, "link") : 0;
  const logs = g.tags.length ? related(g.tags, "log") : 0;
  return (
    <li className="card rounded-2xl p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link href={`/admin?e=${g.id}`} className="text-[15px] font-medium text-ink hover:text-accent">{g.title}</Link>
        {g.due_on && (
          <span className={`text-[12px] ${days !== null && days > 0 ? "font-medium text-ink" : "text-faint"}`}>
            {days === 0 ? "Due today" : days !== null && days > 0 ? `${days} days past ${fmtDate(g.due_on)}` : `By ${fmtDate(g.due_on)}`}
          </span>
        )}
      </div>
      {total > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-2 text-[12px] text-muted">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label="Milestones done">
              <div className="h-full rounded-full" style={{ width: `${(done / total) * 100}%`, background: "var(--grad)" }} />
            </div>
            {done}/{total}
          </div>
          <Milestones id={g.id} items={tasks(g.body_md)} />
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusPicker id={g.id} kind="goal" status={g.status ?? "open"} only={["achieved", "dropped"]} />
        {g.tags.map((t) => <Link key={t} href={`/admin?tag=${t}`} className="font-mono text-[11.5px] text-faint hover:text-ink">#{t}</Link>)}
        {(res > 0 || logs > 0) && <span className="text-[12px] text-faint">{[res && `${res} resources`, logs && `${logs} logs`].filter(Boolean).join(" · ")}</span>}
      </div>
    </li>
  );
}
