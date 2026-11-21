import type { Metadata } from "next";
import { PageHeader } from "@/components/Section";
import { ProjectCard } from "@/components/ProjectCard";
import { projects } from "@/data/projects";

export const metadata: Metadata = { title: "Projects", description: "Backend, Generative AI and Machine Learning projects." };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader tone="violet" label="Projects" title="Things I've built" intro="RAG systems, ML pipelines and full-stack applications. Each page covers architecture, decisions and trade-offs." />
      <div className="mx-auto grid max-w-6xl gap-4 px-4 pb-28 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {projects.map((p, i) => <ProjectCard key={p.slug} project={p} index={i} />)}
      </div>
    </>
  );
}
