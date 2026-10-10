import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getVisitCount } from "@/lib/visits";

const CARDS = [
  { table: "projects", label: "Projects", href: "/admin/projects", accent: "#a855f7" },
  { table: "project_sections", label: "Case study sections", href: "/admin/sections", accent: "#38bdf8" },
  { table: "architecture_diagrams", label: "Architecture diagrams", href: "/admin/diagrams", accent: "#818cf8" },
  { table: "project_milestones", label: "Milestones", href: "/admin/milestones", accent: "#a3e635" },
  { table: "technologies", label: "Technologies", href: "/admin/technologies", accent: "#fbbf24" },
  { table: "articles", label: "Articles", href: "/admin/articles", accent: "#34d399" },
  { table: "experiments", label: "Experiments", href: "/admin/lab", accent: "#f43f5e" },
  { table: "timeline_entries", label: "Experience", href: "/admin/experience", accent: "#22d3ee" },
] as const;

export default async function Dashboard() {
  const { supabase, user } = await requireAdmin();
  const visits = await getVisitCount();

  const counts = await Promise.all(
    CARDS.map(async (c) => {
      const all = await supabase.from(c.table).select("id", { count: "exact", head: true });
      const pub = await supabase.from(c.table).select("id", { count: "exact", head: true }).eq("state", "published");
      return { ...c, total: all.count ?? 0, published: pub.count ?? 0 };
    }),
  );

  const { data: recent } = await supabase
    .from("projects").select("slug,title,state,updated_at").order("updated_at", { ascending: false }).limit(5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">
          Signed in as {user.email}. Every write below goes through row-level security as this user.
        </p>
      </div>

      <div className="card ring-grad rounded-2xl p-5">
        <p className="text-[13px] text-muted">Site visits</p>
        <p className="mt-1 text-[28px] font-semibold tracking-tight">{visits.toLocaleString()}</p>
        <p className="mt-1 font-mono text-[11.5px] text-faint">
          site_config.visit_count, +1 per real page view
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {counts.map((c) => (
          <Link key={c.table} href={c.href} className="card card-hover ring-grad rounded-2xl p-5">
            <div className="h-1 w-8 rounded-full" style={{ background: c.accent }} />
            <p className="mt-4 text-[13px] text-muted">{c.label}</p>
            <p className="mt-1 text-[28px] font-semibold tracking-tight">{c.total}</p>
            <p className="mt-1 font-mono text-[11.5px] text-faint">
              {c.published} published · {c.total - c.published} not live
            </p>
          </Link>
        ))}
      </div>

      <section className="card rounded-2xl p-5">
        <h2 className="text-[14px] font-semibold">Recently updated projects</h2>
        <ul className="mt-4 divide-y divide-line">
          {(recent ?? []).map((r) => (
            <li key={r.slug} className="flex items-center justify-between gap-3 py-2.5 text-[13.5px]">
              <Link href={`/projects/${r.slug}`} target="_blank" className="truncate text-ink hover:text-accent">{r.title}</Link>
              <span className="shrink-0 font-mono text-[11.5px] text-faint">
                {r.state} · {new Date(r.updated_at).toLocaleDateString("en-GB")}
              </span>
            </li>
          ))}
          {(recent ?? []).length === 0 && <li className="py-3 text-[13.5px] text-muted">Nothing yet.</li>}
        </ul>
      </section>

      <section className="card rounded-2xl p-5">
        <h2 className="text-[14px] font-semibold">How authorisation works here</h2>
        <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
          Middleware redirects anonymous requests away from <code className="rounded bg-raised px-1 py-0.5 font-mono text-[12px]">/admin</code>,
          and every Server Action calls <code className="rounded bg-raised px-1 py-0.5 font-mono text-[12px]">requireAdmin()</code> again
          server-side. Neither of those is the real control: the authoritative check is a Postgres
          RLS policy that joins against <code className="rounded bg-raised px-1 py-0.5 font-mono text-[12px]">admin_allowlist</code>.
          If both app-layer checks were deleted, an anonymous client still could not write a row.
        </p>
      </section>
    </div>
  );
}
