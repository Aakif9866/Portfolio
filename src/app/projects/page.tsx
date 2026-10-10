import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Reveal } from "@/components/reveal";
import { ProjectCard } from "@/components/project-card";
import { Empty } from "@/components/empty";
import { publishedProjects, techByProject } from "@/lib/queries";

export const metadata: Metadata = { title: "Work" };
export const revalidate = 300;

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ tech?: string }> }) {
  const { tech } = await searchParams;
  const projects = await publishedProjects();
  const techMap = await techByProject(projects.map((p) => p.id));
  const allTags = [...new Set(Object.values(techMap).flat())].sort((a, b) => a.localeCompare(b));
  const filtered = tech ? projects.filter((p) => (techMap[p.id] ?? []).includes(tech)) : projects;

  return (
    <>
      <PageHeader
        eyebrow="Work"
        title="Case studies"
        lede="Each one covers the problem, the architecture, the decisions I'd defend and the ones I'd revisit. Written for an engineer reading it before an interview."
      />
      <section className="mx-auto max-w-6xl px-6 py-16">
        {allTags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              href="/projects"
              className={`rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${
                !tech ? "border-ink bg-ink text-page" : "border-line text-muted hover:border-line-strong hover:text-ink"
              }`}
            >
              All
            </Link>
            {allTags.map((t) => (
              <Link
                key={t}
                href={`/projects?tech=${encodeURIComponent(t)}`}
                className={`rounded-full border px-3 py-1.5 font-mono text-[12.5px] transition-colors ${
                  t === tech ? "border-ink bg-ink text-page" : "border-line text-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <Empty what="projects" />
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
