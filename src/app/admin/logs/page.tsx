import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { localDay, weekLabel, weekOf, type Entry } from "@/lib/entries";
import { Markdown } from "@/components/markdown";
import { AdminHeader } from "../ui";
import { WorkspaceError } from "../workspace-error";

/**
 * Engineering logs: a timeline of what you worked on, grouped by week. A one-line log is
 * fine. Areas are ordinary tags, so filtering by area is just filtering by tag.
 */
const AREAS = [
  { tag: "backend", label: "Backend" }, { tag: "system-design", label: "System design" }, { tag: "ai-ml", label: "AI/ML" },
  { tag: "frontend", label: "Frontend" }, { tag: "devops", label: "DevOps" }, { tag: "research", label: "Research" },
];

export default async function Logs({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { supabase } = await requireAdmin();
  const { tag } = await searchParams;
  let query = supabase.from("entries").select("*").eq("kind", "log").order("created_at", { ascending: false }).limit(300);
  if (tag) query = query.contains("tags", [tag.slice(0, 40)]);
  const { data, error } = await query;
  const logs = (data ?? []) as Entry[];

  const weeks = new Map<string, Entry[]>();
  for (const l of logs) {
    const w = weekOf(l.created_at);
    weeks.set(w, [...(weeks.get(w) ?? []), l]);
  }

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-[12.5px] transition-colors ${active ? "border-ink bg-ink text-page" : "border-line text-muted hover:border-line-strong hover:text-ink"}`;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Logs"
        description={<>What you built, broke, fixed and learned. Type <code className="font-mono text-[12.5px]">log: …</code> in the capture box; add an area tag like <code className="font-mono text-[12.5px]">#backend</code> if you want.</>}
      />
      <nav aria-label="Filter by area" className="flex flex-wrap gap-1.5">
        <Link href="/admin/logs" aria-current={!tag ? "page" : undefined} className={chip(!tag)}>All</Link>
        {AREAS.map((a) => (
          <Link key={a.tag} href={`/admin/logs?tag=${a.tag}`} aria-current={tag === a.tag ? "page" : undefined} className={chip(tag === a.tag)}>{a.label}</Link>
        ))}
      </nav>

      {error ? <WorkspaceError error={error} /> : logs.length === 0 ? (
        <p className="card rounded-2xl px-6 py-12 text-center text-[14px] text-muted">
          {tag ? "No logs with that area yet." : "No logs yet. Try “log: set up CI for the portfolio #devops” in the box above."}
        </p>
      ) : (
        <div className="space-y-8">
          {[...weeks].map(([week, items]) => (
            <section key={week} aria-labelledby={`w-${week}`}>
              <h2 id={`w-${week}`} className="mb-3 flex items-baseline gap-2 text-[14px] font-semibold">
                {weekLabel(week)} <span className="font-normal text-faint">{items.length} {items.length === 1 ? "log" : "logs"}</span>
              </h2>
              <ol className="space-y-3 border-l border-line pl-5">
                {items.map((l) => (
                  <li key={l.id} className="relative">
                    <span aria-hidden className="absolute -left-[25px] top-2 h-2 w-2 rounded-full bg-accent" />
                    <div className="flex flex-wrap items-baseline gap-x-2 text-[11.5px] text-faint">
                      <time dateTime={l.created_at}>{new Date(`${localDay(l.created_at)}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</time>
                      {l.tags.length > 0 && <span className="font-mono">{l.tags.map((t) => `#${t}`).join(" ")}</span>}
                      <Link href={`/admin?e=${l.id}`} className="ml-auto text-muted hover:text-ink hover:underline">Edit</Link>
                    </div>
                    <p className="text-[14.5px] font-medium text-ink">{l.title || l.url}</p>
                    {l.body_md && <Markdown className="mt-1 text-[14px]">{l.body_md}</Markdown>}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
