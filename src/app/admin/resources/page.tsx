import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { SOURCE_KEYS, sourceOf, type Entry } from "@/lib/entries";
import { AdminHeader } from "../ui";
import { PinButton } from "../entry-editor";
import { StatusPicker } from "../workspace-ui";
import { WorkspaceError, fmtDate } from "../workspace-error";

/**
 * Resources: every saved link. The learning queue (To read, oldest first) and what you're
 * reading now sit on top; below, everything, filterable by where it comes from. Saving is
 * just pasting a link into the capture box.
 */
export default async function Resources({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const { supabase } = await requireAdmin();
  const { source } = await searchParams;
  const { data, error } = await supabase.from("entries").select("*").eq("kind", "link")
    .order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(500);
  const all = (data ?? []) as Entry[];

  const withSource = all.map((e) => ({ ...e, source: sourceOf(e.url) }));
  const counts: Record<string, number> = {};
  for (const e of withSource) counts[e.source.key] = (counts[e.source.key] ?? 0) + 1;
  const sourceFilter = source && SOURCE_KEYS.includes(source) ? source : null;
  const list = sourceFilter ? withSource.filter((e) => e.source.key === sourceFilter) : withSource;
  const queue = withSource.filter((e) => e.status === "to_read").reverse(); // oldest first
  const reading = withSource.filter((e) => e.status === "reading");

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-[12.5px] transition-colors ${active ? "border-ink bg-ink text-page" : "border-line text-muted hover:border-line-strong hover:text-ink"}`;

  return (
    <div className="space-y-8">
      <AdminHeader title="Resources" description="Links worth keeping. Paste one into the capture box to save it; mark it To read to add it to your learning queue." />
      {error ? <WorkspaceError error={error} /> : all.length === 0 ? (
        <p className="card rounded-2xl px-6 py-12 text-center text-[14px] text-muted">No resources yet. Paste any link (a video, repo, article, course) into the box above.</p>
      ) : (
        <>
          {!sourceFilter && (reading.length > 0 || queue.length > 0) && (
            <div className="grid gap-5 lg:grid-cols-2">
              <Section title="Reading now" empty="Nothing in progress." items={reading} />
              <Section title={`Learning queue · ${queue.length}`} empty="Queue is empty. Mark a resource To read to add it." items={queue.slice(0, 10)} />
            </div>
          )}

          <section className="space-y-3">
            <h2 className="text-[15px] font-semibold">{sourceFilter ? `${list[0]?.source.label ?? "Filtered"} · ${list.length}` : `All resources · ${all.length}`}</h2>
            <nav aria-label="Filter by source" className="flex flex-wrap gap-1.5">
              <Link href="/admin/resources" aria-current={!sourceFilter ? "page" : undefined} className={chip(!sourceFilter)}>All</Link>
              {SOURCE_KEYS.filter((k) => counts[k]).map((k) => (
                <Link key={k} href={`/admin/resources?source=${k}`} aria-current={sourceFilter === k ? "page" : undefined} className={chip(sourceFilter === k)}>
                  {withSource.find((e) => e.source.key === k)?.source.label} {counts[k]}
                </Link>
              ))}
            </nav>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
              {list.map((e) => <ResourceRow key={e.id} e={e} />)}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function Section({ title, empty, items }: { title: string; empty: string; items: (Entry & { source: { label: string } })[] }) {
  return (
    <section className="card rounded-2xl p-4">
      <h2 className="mb-2 text-[14px] font-semibold">{title}</h2>
      {items.length === 0 ? <p className="text-[13px] text-muted">{empty}</p> : (
        <ul className="divide-y divide-line">{items.map((e) => <ResourceRow key={e.id} e={e} compact />)}</ul>
      )}
    </section>
  );
}

function ResourceRow({ e, compact }: { e: Entry & { source: { label: string } }; compact?: boolean }) {
  // An AI summary (if one was made) beats the page's own description.
  const description = typeof e.meta?.summary === "string" ? e.meta.summary : typeof e.meta?.description === "string" ? e.meta.description : null;
  return (
    <li className={`flex items-start gap-3 ${compact ? "py-2.5" : "px-4 py-3"}`}>
      {!compact && <PinButton id={e.id} pinned={e.pinned} />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 text-[11.5px] text-faint">
          <span className="font-mono uppercase tracking-wider">{e.source.label}</span>
          {e.tags.length > 0 && <span className="font-mono">{e.tags.map((t) => `#${t}`).join(" ")}</span>}
          <span className="ml-auto shrink-0">{fmtDate(e.created_at)}</span>
        </div>
        <a href={e.url ?? "#"} target="_blank" rel="noopener noreferrer" className="mt-0.5 block truncate text-[14.5px] font-medium text-ink hover:text-accent">
          {e.title || e.url}
        </a>
        {!compact && (e.body_md || description) && <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{e.body_md || description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusPicker id={e.id} kind="link" status={e.status} />
          <Link href={`/admin?e=${e.id}`} className="text-[12.5px] text-muted underline-offset-2 hover:text-ink hover:underline">Edit</Link>
        </div>
      </div>
    </li>
  );
}
