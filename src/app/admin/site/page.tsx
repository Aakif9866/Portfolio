import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getVisitCount } from "@/lib/visits";
import type { Project, ProjectSection } from "@/lib/types";
import { AdminHeader, BTN, StateChip } from "../ui";
import { projectChecks } from "../checks";

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

  const LIMIT = 6;
  const attention = [
    ...drafts.map((d) => ({ key: `d-${d.type}-${d.id}`, href: d.href, title: d.title, meta: `${d.type} · draft`, done: null as null | number, total: 0 })),
    ...gaps.map(({ p, missing, total }) => ({ key: `g-${p.id}`, href: `/admin/projects/${p.id}?tab=publishing`, title: p.title, meta: `Missing ${missing.slice(0, 2).map((m) => m.label.toLowerCase()).join(", ")}${missing.length > 2 ? ` +${missing.length - 2} more` : ""}`, done: total - missing.length, total })),
  ];
  const card = "card rounded-2xl p-5";
  const heading = "text-[16px] font-semibold tracking-[-0.01em]";

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Dashboard"
        description="What's live, what's in draft, and what needs a look."
        actions={
          <>
            <Link href="/admin/projects?new=1" className={BTN.primary}>+ Add project</Link>
            <Link href="/admin/articles?new=1" className={BTN.secondary}>+ Write article</Link>
          </>
        }
      />

      {/* one row of numbers */}
      <section aria-label="At a glance" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {TYPES.map((t) => {
          const rows = lists[t.key];
          const n = (st: string) => rows.filter((r) => r.state === st).length;
          return (
            <div key={t.key} className={`${card} group relative`}>
              <Link href={t.href} className="text-[13.5px] font-medium text-muted hover:text-ink">{t.label}</Link>
              <p className="mt-2 text-[32px] font-semibold leading-none tracking-[-0.02em]">{n("published")}</p>
              <p className="mt-2 text-[12.5px] text-faint">
                live
                {n("draft") > 0 && <> · <Link href={`${t.href}?status=draft`} className="hover:text-ink">{n("draft")} draft</Link></>}
                {n("archived") > 0 && <> · <Link href={`${t.href}?status=archived`} className="hover:text-ink">{n("archived")} archived</Link></>}
              </p>
              <Link href={t.add} aria-label={t.addLabel} title={t.addLabel} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-[18px] leading-none text-faint transition-colors hover:bg-raised hover:text-ink">+</Link>
            </div>
          );
        })}
        <div className={card}>
          <p className="text-[13.5px] font-medium text-muted">Page views</p>
          <p className="mt-2 text-[32px] font-semibold leading-none tracking-[-0.02em]">{visits === null ? "—" : visits.toLocaleString()}</p>
          <p className="mt-2 text-[12.5px] text-faint" title="The counter stores one running total: no dates, pages or visitors.">{visits === null ? "couldn't be read just now" : "all time"}</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="attention-h" className={card}>
          <div className="flex items-baseline justify-between">
            <h2 id="attention-h" className={heading}>Needs attention</h2>
            {attention.length > 0 && <span className="text-[13px] text-faint">{attention.length}</span>}
          </div>
          {attention.length === 0 ? (
            <p className="mt-3 text-[14px] text-muted">All clear. Everything is published and every case study has its key parts.</p>
          ) : (
            <ul className="mt-3 space-y-1">
              {attention.slice(0, LIMIT).map((a) => (
                <li key={a.key}>
                  <Link href={a.href} className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-raised/70">
                    <span className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-[14.5px] font-medium">{a.title}</span>
                      {a.done !== null && <span className="shrink-0 text-[12.5px] text-faint">{a.done}/{a.total}</span>}
                    </span>
                    {a.done !== null && (
                      <span aria-hidden className="mt-1.5 block h-1 overflow-hidden rounded-full bg-raised">
                        <span className="block h-full rounded-full bg-accent" style={{ width: `${(a.done / a.total) * 100}%` }} />
                      </span>
                    )}
                    <span className="mt-1 block truncate text-[12.5px] text-muted">{a.meta}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {attention.length > LIMIT && <p className="mt-2 px-3 text-[13px] text-faint">+{attention.length - LIMIT} more in Projects, Articles and Experiments</p>}
        </section>

        <section aria-labelledby="recent-h" className={card}>
          <h2 id="recent-h" className={heading}>Recent changes</h2>
          {recent.length === 0 ? (
            <p className="mt-3 text-[14px] text-muted">No edits yet.</p>
          ) : (
            <ul className="mt-3 space-y-1">
              {recent.slice(0, LIMIT).map((r) => (
                <li key={r.type + r.id}>
                  <Link href={r.href} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-raised/70">
                    <span className="min-w-0">
                      <span className="block truncate text-[14.5px] font-medium">{r.title}</span>
                      <span className="text-[12.5px] text-muted">{r.type} · {ago(r.updated_at)}</span>
                    </span>
                    <StateChip state={r.state} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

    </div>
  );
}
