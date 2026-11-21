import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/data/projects";
import { areaTone, tone } from "@/lib/tone";

export function ProjectCard({ project: p, index }: { project: Project; index: number }) {
  return (
    <Link
      href={`/projects/${p.slug}`}
      style={tone(areaTone[p.area])}
      className="group flex h-full flex-col rounded-lg border border-line border-t-2 border-t-(--tone) bg-surface bg-linear-to-b from-(--tone)/8 to-transparent to-40% p-6 transition-colors hover:border-(--tone)/60"
    >
      <div className="flex items-center justify-between font-mono text-xs text-muted">
        <span>
          <span className="text-(--tone)">{String(index + 1).padStart(2, "0")}</span>
          <span className="ml-2 rounded-full bg-(--tone)/10 px-2 py-0.5 text-(--tone)">{p.area}</span>
        </span>
        <ArrowUpRight aria-hidden className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-(--tone)" />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-heading">{p.title}</h3>
      <p className="mt-2 flex-1 text-sm text-muted">{p.tagline}</p>
      <p className="mt-6 font-mono text-xs text-muted">{p.stack.slice(0, 4).join(" · ")}</p>
    </Link>
  );
}
