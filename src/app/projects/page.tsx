import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Reveal } from "@/components/reveal";
import { ProjectCard } from "@/components/project-card";
import { Empty } from "@/components/empty";
import { publishedProjects, techByProject } from "@/lib/queries";

export const metadata: Metadata = { title: "Projects" };
export const revalidate = 300;

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ tech?: string }> }) {
  const { tech } = await searchParams;
  const projects = await publishedProjects();
  const techMap = await techByProject(projects.map((p) => p.id));
  const allTags = [...new Set(Object.values(techMap).flat())].sort((a, b) => a.localeCompare(b));
  const filtered = tech ? projects.filter((p) => (techMap[p.id] ?? []).includes(tech)) : projects;

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${
      active ? "border-ink bg-ink text-page" : "border-line text-muted hover:border-line-strong hover:text-ink"
    }`;

  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="Projects"
        lede="Detailed case studies of things I've built: the problem, the architecture, the decisions and what I'd change. Open any project for the full write-up, diagrams and code links."
      />
      <section className="mx-auto max-w-6xl px-6 py-16">
        {allTags.length > 0 && (
          <div className="mb-8">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-faint">Filter by technology</h2>
              <p className="text-[13px] text-muted" aria-live="polite">
                Showing {filtered.length} of {projects.length} projects{tech ? <> using <span className="font-medium text-ink">{tech}</span></> : null}
                {tech && <> · <Link href="/projects" className="text-accent hover:underline">Clear filter</Link></>}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/projects" aria-current={!tech ? "page" : undefined} className={chip(!tech)}>
                All
              </Link>
              {allTags.map((t) => (
                <Link
                  key={t}
                  href={`/projects?tech=${encodeURIComponent(t)}`}
                  aria-current={t === tech ? "page" : undefined}
                  className={`${chip(t === tech)} font-mono`}
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          tech ? (
            <Empty title={`No projects use ${tech}.`} action={{ href: "/projects", label: "Show all projects" }} />
          ) : (
            <Empty title="No projects published yet." body="Case studies will appear here once they're published." />
          )
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 70}>
                <div className="h-full">
                  <ProjectCard project={p} index={i} tech={techMap[p.id] ?? []} />
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
