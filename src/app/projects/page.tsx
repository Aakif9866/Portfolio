import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ProjectCard } from "@/components/project-card";
import { Empty } from "@/components/empty";
import { TechFilter } from "@/components/tech-filter";
import { publishedProjects, techByProject } from "@/lib/queries";

export const metadata: Metadata = { title: "Projects" };
export const revalidate = 300;

// Static: the ?tech= filter runs in the browser (TechFilter), so this page is prerendered.
export default async function ProjectsPage() {
  const projects = await publishedProjects();
  const techMap = await techByProject(projects.map((p) => p.id));
  const counts: Record<string, number> = {};
  for (const t of Object.values(techMap).flat()) counts[t] = (counts[t] ?? 0) + 1;
  const tags = Object.keys(counts).sort((a, b) => a.localeCompare(b));

  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="Projects"
        lede="Detailed case studies of things I've built: the problem, the architecture, the decisions and what I'd change. Open any project for the full write-up, diagrams and code links."
      />
      <section className="mx-auto max-w-6xl px-6 py-16">
        {projects.length === 0 ? (
          <Empty title="No projects published yet." body="Case studies will appear here once they're published." />
        ) : (
          <>
            <TechFilter tags={tags} counts={counts} total={projects.length} />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, i) => (
                <div key={p.id} data-tags={`|${(techMap[p.id] ?? []).join("|")}|`} className="rv">
                  <div className="h-full">
                    <ProjectCard project={p} index={i} tech={techMap[p.id] ?? []} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
