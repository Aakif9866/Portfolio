import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Reveal } from "@/components/reveal";
import { Markdown } from "@/components/markdown";
import { supabasePublic } from "@/lib/supabase/server";
import { TECH_GROUPS } from "@/lib/types";
import type { Technology } from "@/lib/types";

export const metadata: Metadata = { title: "Stack" };
export const revalidate = 300;

export default async function SystemPage() {
  const sb = supabasePublic();
  const [techRes, linkRes] = await Promise.all([
    sb.from("technologies").select("*").order("position"),
    sb.from("project_technologies").select("technology_id, projects(slug,title,state)"),
  ]);

  const tech = (techRes.data ?? []) as Technology[];
  const usedIn: Record<string, { slug: string; title: string }[]> = {};
  for (const row of (linkRes.data ?? []) as unknown as { technology_id: string; projects: { slug: string; title: string; state: string } | null }[]) {
    if (!row.projects || row.projects.state !== "published") continue;
    (usedIn[row.technology_id] ??= []).push({ slug: row.projects.slug, title: row.projects.title });
  }

  const groups = TECH_GROUPS.map((g) => ({ ...g, items: tech.filter((t) => t.category === g.key) })).filter((g) => g.items.length > 0);

  return (
    <>
      <PageHeader
        eyebrow="Stack"
        title="The system"
        lede={`${tech.length} technologies, grouped by where they sit in a system. Each one links to the projects where I actually used it — not a skills bar chart.`}
      />

      <div className="mx-auto max-w-6xl px-6 py-14">
        {/* jump bar */}
        <nav className="sticky top-14 z-30 -mx-6 mb-12 flex gap-1.5 overflow-x-auto border-b border-line bg-page/85 px-6 py-3 backdrop-blur">
          {groups.map((g) => (
            <a key={g.key} href={`#${g.key}`} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[12.5px] text-muted transition-colors hover:border-line-strong hover:text-ink">
              {g.label} <span className="text-faint">{g.items.length}</span>
            </a>
          ))}
        </nav>

        <div className="space-y-16">
          {groups.map((g) => (
            <section key={g.key} id={g.key} className="scroll-mt-32">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: g.accent }} />
                <h2 className="text-[22px] font-semibold tracking-tight">{g.label}</h2>
                <span className="font-mono text-[12px] text-faint">{g.items.length}</span>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {g.items.map((t, i) => {
                  const projects = usedIn[t.id] ?? [];
                  return (
                    <Reveal key={t.id} delay={(i % 3) * 50}>
                      <div id={t.slug} className="card card-hover ring-grad h-full scroll-mt-32 rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-[15.5px] font-semibold" style={{ color: t.color ?? undefined }}>
                            {t.name}
                          </h3>
                          {t.url && (
                            <a href={t.url} target="_blank" rel="noopener" aria-label={`${t.name} documentation`} className="shrink-0 text-faint transition-colors hover:text-ink">
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 17 17 7M9 7h8v8" /></svg>
                            </a>
                          )}
                        </div>
                        {t.summary_md && <div className="mt-2.5 text-[13.5px]"><Markdown>{t.summary_md}</Markdown></div>}
                        {projects.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-3.5">
                            {projects.map((p) => (
                              <Link key={p.slug} href={`/projects/${p.slug}`} className="rounded-md bg-raised px-2 py-0.5 text-[11.5px] text-muted transition-colors hover:text-ink">
                                {p.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
