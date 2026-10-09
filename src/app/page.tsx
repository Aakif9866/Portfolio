import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { ProjectCard } from "@/components/project-card";
import { publishedProjects, techByProject, allTechnologies } from "@/lib/queries";
import { supabasePublic } from "@/lib/supabase/server";
import { TECH_GROUPS } from "@/lib/types";
import type { Experiment, TimelineEntry } from "@/lib/types";

export const revalidate = 300;

export default async function Home() {
  const sb = supabasePublic();
  const [projects, tech, labRes, workRes] = await Promise.all([
    publishedProjects(),
    allTechnologies(),
    sb.from("experiments").select("*").eq("state", "published").order("position").limit(3),
    sb.from("timeline_entries").select("*").eq("state", "published").eq("kind", "work").order("start_date", { ascending: false }).limit(2),
  ]);
  const techMap = await techByProject(projects.map((p) => p.id));
  const lab = (labRes.data ?? []) as Experiment[];
  const work = (workRes.data ?? []) as TimelineEntry[];

  const featured = projects.filter((p) => p.featured).slice(0, 4);
  const counts = TECH_GROUPS.map((g) => ({ ...g, n: tech.filter((t) => t.category === g.key).length })).filter((g) => g.n > 0);

  return (
    <>
      {/* ── hero ── */}
      <section className="relative overflow-hidden spotlight pb-24 pt-36">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-70" />
        <div className="pointer-events-none absolute -top-48 left-1/2 h-[460px] w-[920px] -translate-x-1/2">
          <div className="aurora h-full w-full rounded-full bg-[conic-gradient(from_210deg,#fb923c,#f43f5e,#a855f7,#38bdf8,#fb923c)]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-3 py-1 text-[12.5px] text-muted backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Open to software engineering roles
          </div>

          <h1 className="animate-fade-up mt-7 max-w-4xl text-[clamp(40px,6vw,66px)] font-semibold leading-[1.03] tracking-tightest">
            I build the <span className="grad-text">unglamorous parts</span>
            <br />
            that make software hold up.
          </h1>

          <p className="animate-fade-up mt-7 max-w-2xl text-[19px] leading-relaxed text-muted">
            Software engineer working across backend systems, AI agent infrastructure and full-stack
            products. Most of what I build is the layer underneath the demo — routing, guardrails,
            storage, sync, tests. Every case study below is a row in a Postgres database I designed.
          </p>

          <div className="animate-fade-up mt-9 flex flex-wrap items-center gap-3">
            <Link href="/projects" className="group inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-page transition-opacity hover:opacity-85">
              Read the case studies
              <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <a href="mailto:aakif9866@gmail.com" className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-5 py-2.5 text-[14px] font-medium transition-colors hover:bg-raised">
              aakif9866@gmail.com
            </a>
          </div>

          <dl className="animate-fade-up mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {[
              { k: "Case studies", v: String(projects.length) },
              { k: "Technologies", v: String(tech.length) },
              { k: "Experiments", v: String(lab.length ? lab.length : 0) + "+" },
              { k: "Focus", v: "Backend · AI" },
            ].map((s) => (
              <div key={s.k} className="bg-card px-5 py-5">
                <dt className="text-[11.5px] uppercase tracking-wider text-faint">{s.k}</dt>
                <dd className="mt-1.5 text-[17px] font-medium">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── selected work ── */}
      <section className="border-t border-line bg-surface py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-faint">01 — Selected work</p>
                <h2 className="mt-3 text-[clamp(28px,4vw,40px)] font-semibold tracking-tightest">Systems I shipped</h2>
              </div>
              <Link href="/projects" className="hidden shrink-0 items-center gap-1.5 text-[13.5px] text-muted transition-colors hover:text-ink md:inline-flex">
                All {projects.length} projects
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={i * 70} className={i === 0 ? "md:col-span-2" : ""}>
                <div className="h-full">
                  <ProjectCard project={p} index={i} tech={techMap[p.id] ?? []} featured={i === 0} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── stack ── */}
      <section className="border-t border-line py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-faint">02 — Stack</p>
            <h2 className="mt-3 text-[clamp(28px,4vw,40px)] font-semibold tracking-tightest">What I reach for</h2>
            <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted">
              {tech.length} technologies, each tied to the project where I actually used it.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {counts.map((g, i) => (
              <Reveal key={g.key} delay={i * 50}>
                <Link href={`/system#${g.key}`} className="card card-hover ring-grad block h-full rounded-2xl p-6">
                  <div className="h-1 w-9 rounded-full" style={{ background: `linear-gradient(90deg, ${g.accent}, transparent)` }} />
                  <h3 className="mt-4 flex items-baseline justify-between text-[14.5px] font-semibold uppercase tracking-wider">
                    {g.label}
                    <span className="font-mono text-[12px] font-normal text-faint">{g.n}</span>
                  </h3>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
                    {tech.filter((t) => t.category === g.key).slice(0, 5).map((t) => t.name).join(" · ")}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── lab + experience ── */}
      {(lab.length > 0 || work.length > 0) && (
        <section className="border-t border-line bg-surface py-24">
          <div className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-2">
            {lab.length > 0 && (
              <Reveal>
                <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-faint">03 — Lab</p>
                <h2 className="mt-3 text-[28px] font-semibold tracking-tightest">Open experiments</h2>
                <ul className="mt-7 space-y-3">
                  {lab.map((e) => (
                    <li key={e.id}>
                      <Link href={`/lab/${e.slug}`} className="card card-hover group block rounded-xl p-5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[15px] font-medium">{e.title}</span>
                          <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">{e.status}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-muted">{e.summary}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/lab" className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] text-muted hover:text-ink">
                  All experiments
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
              </Reveal>
            )}

            <Reveal delay={100}>
              <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-faint">04 — Contact</p>
              <h2 className="mt-3 text-[28px] font-semibold tracking-tightest">
                Hiring, or <span className="grad-text">curious how it works?</span>
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-muted">
                Happy to walk through any of these systems — the architecture, the tradeoffs, and the
                parts that broke first. Each case study has an architecture diagram and a decisions
                section for exactly that conversation.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="mailto:aakif9866@gmail.com" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-page transition-opacity hover:opacity-85">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m3 7 9 6 9-6" /></svg>
                  Email me
                </a>
                <a href="https://github.com/Aakif9866" target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-5 py-2.5 text-[14px] font-medium transition-colors hover:bg-raised">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.55v-2c-3.2.7-3.88-1.4-3.88-1.4-.53-1.34-1.3-1.7-1.3-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.56-.3-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.3-.52-1.48.11-3.08 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.18-1.49 3.14-1.18 3.14-1.18.63 1.6.23 2.78.12 3.07.74.82 1.18 1.85 1.18 3.11 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .3.2.66.8.55A11.5 11.5 0 0 0 23.5 12A11.5 11.5 0 0 0 12 .5Z" /></svg>
                  Aakif9866
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
