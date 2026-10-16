import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Markdown } from "@/components/markdown";
import { ArchitectureDiagram } from "@/components/diagram";
import { StatusPill } from "@/components/project-card";
import { SECTION_ORDER, SECTION_LABEL } from "@/lib/types";
import type { Project, ProjectSection, Diagram, Technology } from "@/lib/types";

/**
 * Loads one case study. Sections are always published-only — that is what a
 * visitor sees. The public route also requires the project itself to be
 * published; the admin preview passes publishedOnly: false (and its own
 * session-bound client) to show a draft exactly as it would look once live.
 */
export async function loadCaseStudy(sb: SupabaseClient, by: { slug?: string; id?: string; publishedOnly: boolean }) {
  let q = sb.from("projects").select("*");
  q = by.id ? q.eq("id", by.id) : q.eq("slug", by.slug ?? "");
  if (by.publishedOnly) q = q.eq("state", "published");
  const { data: project } = await q.maybeSingle();
  if (!project) return null;

  const [sections, diagrams, techRes, milestones] = await Promise.all([
    sb.from("project_sections").select("*").eq("project_id", project.id).eq("state", "published").order("position"),
    sb.from("architecture_diagrams").select("*").eq("project_id", project.id).order("position"),
    sb.from("project_technologies").select("technologies(*)").eq("project_id", project.id),
    sb.from("project_milestones").select("*").eq("project_id", project.id).order("position"),
  ]);

  return {
    project: project as Project,
    sections: (sections.data ?? []) as ProjectSection[],
    diagrams: (diagrams.data ?? []) as Diagram[],
    tech: ((techRes.data ?? []) as unknown as { technologies: Technology | null }[]).map((r) => r.technologies).filter(Boolean) as Technology[],
    milestones: (milestones.data ?? []) as { id: string; label: string | null; title: string; body_md: string | null; occurred_on: string | null; reference_url: string | null }[],
  };
}

const fmt = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : null;

export type CaseStudyData = NonNullable<Awaited<ReturnType<typeof loadCaseStudy>>>;

/** The full case-study page body. Used by the public route and the admin preview. */
export function CaseStudyView({ data }: { data: CaseStudyData }) {
  const { project, sections, diagrams, tech, milestones } = data;

  // Render sections in canonical order, not insert order.
  const ordered = [...sections].sort(
    (a, b) => SECTION_ORDER.indexOf(a.kind as never) - SECTION_ORDER.indexOf(b.kind as never),
  );
  const archIndex = ordered.findIndex((s) => s.kind === "architecture");

  // "On this page" — mirrors exactly what renders below, in the same order.
  const toc = [
    ...(tech.length > 0 ? [{ id: "built-with", label: "Built with" }] : []),
    ...ordered.map((s) => ({ id: s.kind, label: s.heading ?? SECTION_LABEL[s.kind] ?? s.kind })),
    ...(archIndex === -1 && diagrams.length > 0 ? [{ id: "architecture", label: "Architecture" }] : []),
    ...(milestones.length > 0 ? [{ id: "milestones", label: "Milestones" }] : []),
  ];
  const tocLinks = (
    <ol className="space-y-1 text-[13.5px]">
      {toc.map((t) => (
        <li key={t.id}>
          <a href={`#${t.id}`} className="block rounded-md px-2.5 py-1.5 text-muted transition-colors hover:bg-raised hover:text-ink">{t.label}</a>
        </li>
      ))}
    </ol>
  );

  const facts = [
    ["Role", project.role],
    ["Team", project.team_size ? `${project.team_size}` : null],
    ["Started", fmt(project.started_on)],
    ["Ended", fmt(project.ended_on) ?? (project.status === "active" ? "Ongoing" : null)],
    ["Type", project.kind],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <article>
      <header className="relative overflow-hidden spotlight border-b border-line pb-14 pt-32">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
        <div className="relative mx-auto max-w-4xl px-6">
          <Link href="/projects" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
            All projects
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <StatusPill status={project.status} />
            {project.featured && <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">Featured</span>}
          </div>
          <h1 className="mt-5 text-[clamp(34px,5.5vw,54px)] font-semibold leading-[1.04] tracking-tightest">{project.title}</h1>
          {project.thesis && <p className="mt-6 max-w-3xl text-[19px] leading-relaxed text-muted">{project.thesis}</p>}

          <div className="mt-8 flex flex-wrap gap-3">
            {project.repo_url && (
              <a href={project.repo_url} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[13.5px] font-medium text-page transition-opacity hover:opacity-85">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.55v-2c-3.2.7-3.88-1.4-3.88-1.4-.53-1.34-1.3-1.7-1.3-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.56-.3-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.3-.52-1.48.11-3.08 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.18-1.49 3.14-1.18 3.14-1.18.63 1.6.23 2.78.12 3.07.74.82 1.18 1.85 1.18 3.11 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .3.2.66.8.55A11.5 11.5 0 0 0 23.5 12A11.5 11.5 0 0 0 12 .5Z" /></svg>
                Repository
              </a>
            )}
            {project.demo_url && (
              <a href={project.demo_url} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-[13.5px] font-medium transition-colors hover:bg-raised">
                Live demo
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-14 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
        {toc.length > 2 && (
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-24">
              <p className="px-2.5 font-mono text-[11px] uppercase tracking-wider text-faint">On this page</p>
              <div className="mt-2">{tocLinks}</div>
            </div>
          </nav>
        )}
      <div className={`mx-auto max-w-4xl ${toc.length > 2 ? "lg:col-start-2 lg:mx-0" : "lg:col-span-2"}`}>
        {toc.length > 2 && (
          <details className="card mb-10 rounded-2xl p-4 lg:hidden">
            <summary className="cursor-pointer text-[13.5px] font-medium">On this page</summary>
            <nav aria-label="On this page" className="mt-3">{tocLinks}</nav>
          </details>
        )}
        {facts.length > 0 && (
          <dl className="mb-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-5">
            {facts.map(([k, v]) => (
              <div key={k} className="bg-card px-4 py-4">
                <dt className="text-[11px] uppercase tracking-wider text-faint">{k}</dt>
                <dd className="mt-1 text-[14px] font-medium capitalize">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        {tech.length > 0 && (
          <section id="built-with" className="mb-14 scroll-mt-24">
            <h2 className="font-mono text-[12px] uppercase tracking-[0.18em] text-faint">Built with</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {tech.map((t) => (
                <Link
                  key={t.id}
                  href={`/system#${t.slug}`}
                  className="rounded-lg border border-line bg-card px-2.5 py-1.5 font-mono text-[12px] text-muted transition-colors hover:border-line-strong hover:text-ink"
                  style={t.color ? { borderLeftColor: t.color, borderLeftWidth: 2 } : undefined}
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {ordered.length === 0 && diagrams.length === 0 && (
          <p className="card rounded-2xl px-8 py-14 text-center text-[14px] text-muted">
            The write-up for this project is still in draft. The repository link above is live.
          </p>
        )}

        {ordered.map((s, i) => (
          <section key={s.id} id={s.kind} className="mb-14 scroll-mt-24">
            <h2 className="mb-5 flex items-baseline gap-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-faint">
              <span className="h-px w-8 bg-line-strong" />
              {s.heading ?? SECTION_LABEL[s.kind] ?? s.kind}
            </h2>
            {s.body_md && <Markdown>{s.body_md}</Markdown>}
            {/* diagrams belong with the architecture section */}
            {i === archIndex && diagrams.map((d) => (
              <div key={d.id} className="mt-8">
                <h3 className="mb-4 text-[16px] font-semibold">{d.title}</h3>
                <ArchitectureDiagram diagram={d} />
              </div>
            ))}
          </section>
        ))}

        {/* diagrams with no architecture section to attach to */}
        {archIndex === -1 && diagrams.map((d) => (
          <section key={d.id} id="architecture" className="mb-14 scroll-mt-24">
            <h2 className="mb-5 flex items-baseline gap-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-faint">
              <span className="h-px w-8 bg-line-strong" />
              Architecture
            </h2>
            <h3 className="mb-4 text-[16px] font-semibold">{d.title}</h3>
            <ArchitectureDiagram diagram={d} />
          </section>
        ))}

        {milestones.length > 0 && (
          <section id="milestones" className="mb-14 scroll-mt-24">
            <h2 className="mb-5 flex items-baseline gap-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-faint">
              <span className="h-px w-8 bg-line-strong" />
              Milestones
            </h2>
            <ol className="relative space-y-6 border-l border-line pl-7">
              {milestones.map((m) => (
                <li key={m.id} className="relative">
                  <span className="absolute -left-[33px] top-1.5 h-2 w-2 rounded-full bg-accent ring-4 ring-page" />
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <p className="text-[15px] font-medium">{m.title}</p>
                    {m.occurred_on && <span className="font-mono text-[11.5px] text-faint">{fmt(m.occurred_on)}</span>}
                    {m.label && <span className="rounded-md bg-raised px-2 py-0.5 font-mono text-[10.5px] uppercase text-muted">{m.label}</span>}
                  </div>
                  {m.body_md && <div className="mt-2"><Markdown>{m.body_md}</Markdown></div>}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
      </div>
    </article>
  );
}
