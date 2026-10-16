import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getVisitCount } from "@/lib/visits";
import type { Project, ProjectSection } from "@/lib/types";
import { AdminHeader, BTN, StateChip } from "./ui";
import { projectChecks } from "./checks";

type Row = { id: string; title: string; state: string; updated_at: string };

const TYPES = [
  { key: "projects", label: "Projects", href: "/admin/projects", add: "/admin/projects?new=1", addLabel: "Add project" },
  { key: "articles", label: "Articles", href: "/admin/articles", add: "/admin/articles?new=1", addLabel: "Write article" },
  { key: "experiments", label: "Experiments", href: "/admin/lab", add: "/admin/lab?new=1", addLabel: "Add experiment" },
  { key: "timeline_entries", label: "Experience", href: "/admin/experience", add: "/admin/experience?new=1", addLabel: "Add experience" },
] as const;

const ago = (iso: string) => {
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : d < 30 ? `${d} days ago` : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export default async function Dashboard() {
  const { supabase } = await requireAdmin();
  const [visits, projectsRes, sectionsRes, articlesRes, experimentsRes, timelineRes, diagramsRes, techRes] = await Promise.all([
    getVisitCount(),
    supabase.from("projects").select("*").order("position"),
    supabase.from("project_sections").select("id, project_id, kind, state, body_md, heading, updated_at"),
    supabase.from("articles").select("id, title, state, updated_at"),
    supabase.from("experiments").select("id, title, state, updated_at"),
    supabase.from("timeline_entries").select("id, title, organisation, state, updated_at"),
    supabase.from("architecture_diagrams").select("project_id"),
    supabase.from("project_technologies").select("project_id"),
  ]);

  const projects = (projectsRes.data ?? []) as Project[];
  const sections = (sectionsRes.data ?? []) as (ProjectSection & { updated_at: string })[];
  const lists: Record<string, Row[]> = {
    projects: projects as unknown as Row[],
    articles: (articlesRes.data ?? []) as Row[],
    experiments: (experimentsRes.data ?? []) as Row[],
    timeline_entries: ((timelineRes.data ?? []) as (Row & { organisation: string })[]).map((t) => ({ ...t, title: `${t.title} · ${t.organisation}` })),
  };
  const count = (rows: { project_id: string }[] | null, id: string) => (rows ?? []).filter((r) => r.project_id === id).length;

  // Needs attention: drafts anywhere, and projects missing key case-study pieces.
  const editHref = (type: string, id: string) =>
    type === "projects" ? `/admin/projects/${id}` : TYPES.find((t) => t.key === type)!.href;
  const drafts = TYPES.flatMap((t) => lists[t.key].filter((r) => r.state === "draft").map((r) => ({ ...r, type: t.label, href: editHref(t.key, r.id) })));
  const gaps = projects
    .map((p) => {
      const checks = projectChecks(p, sections.filter((s) => s.project_id === p.id), count(techRes.data, p.id), count(diagramsRes.data, p.id));
      return { p, missing: checks.filter((c) => !c.done), total: checks.length };
    })
    .filter((g) => g.missing.length > 0);

  const recent = [
    ...TYPES.flatMap((t) => lists[t.key].map((r) => ({ ...r, type: t.label, href: editHref(t.key, r.id) }))),
    ...sections.map((s) => ({
      id: s.id, title: `${projects.find((p) => p.id === s.project_id)?.title ?? "Project"} — ${s.heading ?? s.kind.replace("_", " ")}`,
      state: s.state, updated_at: s.updated_at, type: "Section", href: `/admin/projects/${s.project_id}?tab=case-study`,
    })),
  ]
    .filter((r) => r.updated_at)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Dashboard"
        description="What's live, what's still in draft, and what needs attention."
        actions={TYPES.map((t) => (
          <Link key={t.key} href={t.add} className={t.key === "projects" ? BTN.primary : BTN.secondary}>+ {t.addLabel}</Link>
        ))}
      />

      {/* content status */}
      <section aria-labelledby="status-h">
        <h2 id="status-h" className="sr-only">Content status</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {TYPES.map((t) => {
            const rows = lists[t.key];
            const n = (s: string) => rows.filter((r) => r.state === s).length;
            return (
              <div key={t.key} className="card rounded-2xl p-5">
                <div className="flex items-baseline justify-between">
                  <Link href={t.href} className="text-[14px] font-semibold hover:text-accent">{t.label}</Link>
                  <span className="text-[12.5px] text-muted">{rows.length} total</span>
                </div>
                <p className="mt-3 text-[30px] font-semibold leading-none tracking-tight">{n("published")}</p>
                <p className="mt-1 text-[13px] text-muted">published</p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-[13px]">
                  <Link href={`${t.href}?status=draft`} className="text-muted hover:text-ink">{n("draft")} draft</Link>
                  <Link href={`${t.href}?status=archived`} className="text-muted hover:text-ink">{n("archived")} archived</Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* needs attention */}
        <section aria-labelledby="attention-h" className="card rounded-2xl p-5">
          <h2 id="attention-h" className="text-[15px] font-semibold">Needs attention</h2>
          {drafts.length === 0 && gaps.length === 0 ? (
            <p className="mt-3 text-[14px] text-muted">Nothing outstanding. Every item is published and every project has its key sections.</p>
          ) : (
            <div className="mt-4 space-y-5">
              {drafts.length > 0 && (
                <div>
                  <h3 className="text-[12px] font-medium uppercase tracking-wider text-faint">Drafts — not yet visible</h3>
                  <ul className="mt-2 divide-y divide-line">
                    {drafts.map((d) => (
                      <li key={d.type + d.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
                        <Link href={d.href} className="min-w-0 truncate hover:text-accent">{d.title}</Link>
                        <span className="shrink-0 text-[12.5px] text-muted">{d.type}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {gaps.length > 0 && (
                <div>
                  <h3 className="text-[12px] font-medium uppercase tracking-wider text-faint">Case studies that could be stronger</h3>
                  <ul className="mt-2 divide-y divide-line">
                    {gaps.map(({ p, missing, total }) => (
                      <li key={p.id} className="py-2.5">
                        <div className="flex items-center justify-between gap-3 text-[14px]">
                          <Link href={`/admin/projects/${p.id}?tab=publishing`} className="min-w-0 truncate hover:text-accent">{p.title}</Link>
                          <span className="shrink-0 text-[12.5px] text-muted">{total - missing.length}/{total} done</span>
                        </div>
                        <p className="mt-0.5 text-[12.5px] text-muted">Missing: {missing.map((m) => m.label.toLowerCase()).join(", ")}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {/* recent changes */}
        <section aria-labelledby="recent-h" className="card rounded-2xl p-5">
          <h2 id="recent-h" className="text-[15px] font-semibold">Recent changes</h2>
          {recent.length === 0 ? (
            <p className="mt-3 text-[14px] text-muted">No edits yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {recent.map((r) => (
                <li key={r.type + r.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
                  <div className="min-w-0">
                    <Link href={r.href} className="block truncate hover:text-accent">{r.title}</Link>
                    <span className="text-[12.5px] text-muted">{r.type} · {ago(r.updated_at)}</span>
                  </div>
                  <StateChip state={r.state} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* visits */}
      <section aria-labelledby="visits-h" className="card rounded-2xl p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="visits-h" className="text-[15px] font-semibold">Site visits</h2>
            <p className="mt-2 text-[30px] font-semibold leading-none tracking-tight">{visits === null ? "Unavailable" : visits.toLocaleString()}</p>
            <p className="mt-1 text-[13px] text-muted">{visits === null ? "The counter couldn't be read just now." : "page views in total"}</p>
          </div>
          <p className="max-w-md text-[13px] leading-relaxed text-muted">
            The counter stores a single running total — no dates, pages or visitors — so daily trends and
            per-page numbers are <strong className="font-medium text-ink">not available</strong>, rather than zero.
          </p>
        </div>
      </section>
    </div>
  );
}
