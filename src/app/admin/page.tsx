import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { cleanSearch, type Entry } from "@/lib/entries";
import { ENTRY_KIND, ENTRY_STATUS } from "@/lib/labels";
import { Markdown } from "@/components/markdown";
import { AdminHeader, BTN } from "./ui";
import { EntryEditor, PinButton } from "./entry-editor";

/**
 * The private workspace inbox: everything captured, newest first (pinned on top), with
 * search, kind and tag filters, and an editor for the selected entry. Filters and the open
 * entry live in the URL, so the back button and links just work.
 */
type Search = { q?: string; kind?: string; tag?: string; e?: string };

const LIMIT = 200;

export default async function Inbox({ searchParams }: { searchParams: Promise<Search> }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const q = cleanSearch(sp.q ?? "");
  const kind = sp.kind && ENTRY_KIND[sp.kind] ? sp.kind : undefined;
  const tag = sp.tag?.slice(0, 40);

  let list = supabase.from("entries").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(LIMIT);
  if (kind) list = list.eq("kind", kind);
  if (tag) list = list.contains("tags", [tag]);
  // Substring search over title, notes and link: finds partial words ("kube" → "kubernetes").
  if (q) list = list.or(["title", "body_md", "url"].map((c) => `${c}.ilike."%${q}%"`).join(","));

  // ponytail: counts read kind+tags of every entry; fine for thousands of rows, use a SQL view beyond that.
  const [{ data, error }, { data: facets }, selected] = await Promise.all([
    list,
    supabase.from("entries").select("kind, tags"),
    sp.e ? supabase.from("entries").select("*").eq("id", sp.e).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const entries = (data ?? []) as Entry[];
  const open = (selected.data ?? null) as Entry | null;

  const kindCount: Record<string, number> = {};
  const tagCount: Record<string, number> = {};
  for (const f of facets ?? []) {
    kindCount[f.kind] = (kindCount[f.kind] ?? 0) + 1;
    for (const t of f.tags ?? []) tagCount[t] = (tagCount[t] ?? 0) + 1;
  }
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const total = facets?.length ?? 0;

  const href = (next: Partial<Search>) => {
    const p = new URLSearchParams();
    const merged = { q: sp.q, kind, tag, ...next };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin?${s}` : "/admin";
  };
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-[12.5px] transition-colors ${active ? "border-ink bg-ink text-page" : "border-line text-muted hover:border-line-strong hover:text-ink"}`;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Inbox"
        description="Everything you've captured. Nothing here is ever shown on the public site. Sort things out whenever you like, or never."
        actions={
          <>
            <a href="/admin/export?format=md" className={BTN.secondary}>Export Markdown</a>
            <a href="/admin/export?format=json" className={BTN.secondary}>Export JSON</a>
          </>
        }
      />

      {error ? (
        <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-[13.5px] text-rose-700 dark:text-rose-300">
          {error.code === "PGRST205" || error.code === "42P01" ? "The workspace tables don't exist yet: the migration hasn't been applied." : `Couldn't load entries: ${error.message}`}
        </p>
      ) : (
        <>
          <div className="space-y-3">
            <form action="/admin" className="flex gap-2">
              {kind && <input type="hidden" name="kind" value={kind} />}
              {tag && <input type="hidden" name="tag" value={tag} />}
              <label htmlFor="inbox-q" className="sr-only">Search entries</label>
              <input id="inbox-q" name="q" defaultValue={sp.q} placeholder="Search titles, notes and links…" className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[14px] outline-none focus:border-accent" />
              <button className={BTN.secondary}>Search</button>
              {(q || kind || tag) && <Link href="/admin" className={BTN.quiet}>Clear</Link>}
            </form>
            <nav aria-label="Filter by kind" className="flex flex-wrap gap-1.5">
              <Link href={href({ kind: undefined, e: undefined })} aria-current={!kind ? "page" : undefined} className={chip(!kind)}>All {total}</Link>
              {Object.entries(ENTRY_KIND).filter(([k]) => kindCount[k]).map(([k, v]) => (
                <Link key={k} href={href({ kind: k, e: undefined })} aria-current={kind === k ? "page" : undefined} className={chip(kind === k)}>
                  {v.plural} {kindCount[k]}
                </Link>
              ))}
            </nav>
            {topTags.length > 0 && (
              <nav aria-label="Filter by tag" className="flex flex-wrap gap-1.5">
                {topTags.map(([t, n]) => (
                  <Link key={t} href={href({ tag: tag === t ? undefined : t, e: undefined })} aria-current={tag === t ? "page" : undefined} className={`${chip(tag === t)} font-mono text-[11.5px]`}>
                    #{t} <span className="opacity-60">{n}</span>
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className={open ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]" : ""}>
            {open && (
              <section aria-label="Edit entry" className="card order-first rounded-2xl p-5 xl:order-last xl:sticky xl:top-20 xl:self-start">
                <EntryEditor key={open.id + open.updated_at} entry={open} closeHref={href({ e: undefined })} />
                {open.body_md && (
                  <details className="mt-5 border-t border-line pt-4">
                    <summary className="cursor-pointer text-[13px] font-medium text-muted">Preview notes</summary>
                    <Markdown className="mt-3 text-[14.5px]">{open.body_md}</Markdown>
                  </details>
                )}
              </section>
            )}

            {entries.length === 0 ? (
              <p className="card rounded-2xl px-6 py-12 text-center text-[14px] text-muted">
                {q || kind || tag ? "Nothing matches. Try fewer filters." : "Nothing captured yet. Paste a link or type a thought in the box above."}
              </p>
            ) : (
              <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
                {entries.map((en) => {
                  const status = en.status ? ENTRY_STATUS[en.kind]?.[en.status] : null;
                  const site = typeof en.meta?.site === "string" ? en.meta.site : en.url ? safeHost(en.url) : null;
                  return (
                    <li key={en.id} className={`flex items-start gap-3 px-4 py-3 ${open?.id === en.id ? "bg-raised" : ""}`}>
                      <PinButton id={en.id} pinned={en.pinned} />
                      <Link href={href({ e: en.id })} scroll={false} className="group min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-faint">
                          <span className="font-mono uppercase tracking-wider">{ENTRY_KIND[en.kind]?.label ?? en.kind}</span>
                          {status && <span style={{ color: `color-mix(in oklab, ${status.tone} 60%, var(--ink))` }}>{status.label}</span>}
                          {en.due_on && <span>Due {fmt(en.due_on)}</span>}
                          {site && <span className="truncate">{site}</span>}
                          <span className="ml-auto shrink-0">{fmt(en.created_at)}</span>
                        </div>
                        <p className="mt-0.5 truncate text-[14.5px] font-medium text-ink group-hover:text-accent">{en.title || en.url}</p>
                        {(en.body_md || en.tags.length > 0) && (
                          <p className="mt-0.5 truncate text-[13px] text-muted">
                            {en.tags.map((t) => `#${t}`).join(" ")}{en.tags.length > 0 && en.body_md ? " · " : ""}{en.body_md.slice(0, 160)}
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {entries.length === LIMIT && <p className="text-center text-[12.5px] text-faint">Showing the latest {LIMIT}. Search or filter to find older entries.</p>}
        </>
      )}
    </div>
  );
}

function safeHost(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
