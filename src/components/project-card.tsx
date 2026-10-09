import Link from "next/link";
import type { Project } from "@/lib/types";

const ACCENTS = ["#a855f7", "#38bdf8", "#fbbf24", "#34d399", "#f43f5e", "#22d3ee", "#818cf8", "#a3e635", "#fb923c"];
export const accentFor = (i: number) => ACCENTS[i % ACCENTS.length];

const STATUS_TONE: Record<string, string> = {
  active: "#34d399", shipped: "#38bdf8", exploring: "#a855f7", paused: "#fbbf24", archived: "#8a8a93",
};

export function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "#8a8a93";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wider"
      style={{ color: tone, background: `${tone}18` }}
    >
      <span className="h-1 w-1 rounded-full" style={{ background: tone }} />
      {status}
    </span>
  );
}

export function ProjectCard({
  project, index, tech = [], featured = false,
}: { project: Project; index: number; tech?: string[]; featured?: boolean }) {
  const accent = accentFor(index);
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={`card card-hover ring-grad group relative flex flex-col overflow-hidden rounded-2xl ${featured ? "p-8" : "p-7"}`}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full opacity-45 blur-3xl transition-opacity duration-500 group-hover:opacity-80"
        style={{ background: accent }}
      />
      <div className="relative flex items-center gap-2">
        <StatusPill status={project.status} />
        {project.featured && (
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">Featured</span>
        )}
      </div>

      <h3 className={`relative mt-5 font-semibold tracking-tight ${featured ? "text-[28px]" : "text-[21px]"}`}>
        {project.title}
      </h3>
      <p className={`relative mt-2.5 leading-relaxed text-muted ${featured ? "max-w-xl text-[16px]" : "text-[14.5px]"}`}>
        {project.thesis ?? project.summary}
      </p>

      <div className="relative mt-auto flex flex-wrap items-center gap-1.5 pt-6">
        {tech.slice(0, featured ? 6 : 3).map((t) => (
          <span key={t} className="rounded-md border border-line bg-raised px-2 py-0.5 font-mono text-[11px] text-muted">
            {t}
          </span>
        ))}
        {tech.length > (featured ? 6 : 3) && (
          <span className="font-mono text-[11px] text-faint">+{tech.length - (featured ? 6 : 3)}</span>
        )}
      </div>

      <span className="relative mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors group-hover:text-ink">
        Read the case study
        <svg className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </span>
    </Link>
  );
}
