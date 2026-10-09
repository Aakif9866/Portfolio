import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Reveal } from "@/components/reveal";
import { ProjectCard } from "@/components/project-card";
import { Empty } from "@/components/empty";
import { publishedProjects, techByProject } from "@/lib/queries";

export const metadata: Metadata = { title: "Work" };
export const revalidate = 300;

export default async function ProjectsPage() {
  const projects = await publishedProjects();
  const techMap = await techByProject(projects.map((p) => p.id));

  return (
    <>
      <PageHeader
        eyebrow="Work"
        title="Case studies"
        lede="Each one covers the problem, the architecture, the decisions I'd defend and the ones I'd revisit. Written for an engineer reading it before an interview."
      />
      <section className="mx-auto max-w-6xl px-6 py-16">
        {projects.length === 0 ? (
          <Empty what="projects" />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
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
