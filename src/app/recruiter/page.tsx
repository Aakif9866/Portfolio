import Link from "next/link";
import type { Metadata } from "next";
import { publishedProjects, techByProject, allTechnologies } from "@/lib/queries";
import { supabasePublic } from "@/lib/supabase/server";
import { getContact } from "@/lib/contact";
import { fetchOrThrow } from "@/lib/db";
import { TECH_GROUPS, type TimelineEntry } from "@/lib/types";
import { SITE_NAME } from "@/lib/site";
import { PrintButton } from "./print-button";
import { getGitHub } from "@/lib/github";

/**
 * Recruiter view: the whole profile on one screen, readable in about 30 seconds. Off the main
 * nav (linked from About). Built only from published rows, like every public page. Printing it
 * (the "Save as PDF" button) gives a one-page resume without the site chrome.
 */
export const metadata: Metadata = {
  title: "Recruiter view",
  description: `${SITE_NAME}: software engineer. Experience, core skills, featured projects and education on one page.`,
  alternates: { canonical: "/recruiter" },
};
export const revalidate = 300;

const fmt = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : null);
const range = (e: TimelineEntry) => `${fmt(e.start_date) ?? ""} – ${fmt(e.end_date) ?? "Present"}`;

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.16em] text-faint">{children}</h2>;
}

export default async function RecruiterPage() {
  const sb = supabasePublic();
  const [projects, tech, contact, tl] = await Promise.all([
    publishedProjects(),
    allTechnologies(),
    getContact(),
    fetchOrThrow("timeline", (s) => sb.from("timeline_entries").select("*").abortSignal(s).eq("state", "published").order("start_date", { ascending: false })),
  ]);
  const entries = (tl.data ?? []) as TimelineEntry[];
  const work = entries.filter((e) => e.kind === "work");
  const education = entries.filter((e) => e.kind === "education");
  const current = work.find((e) => !e.end_date);
  const featured = (projects.some((p) => p.featured) ? projects.filter((p) => p.featured) : projects).slice(0, 3);
  const [techMap, gh] = await Promise.all([techByProject(featured.map((p) => p.id)), getGitHub(contact.github)]);
  const skills = TECH_GROUPS.map((g) => ({ ...g, names: tech.filter((t) => t.category === g.key).map((t) => t.name) })).filter((g) => g.names.length > 0);

  const chip = "inline-flex items-center rounded-full border border-line px-3.5 py-1.5 text-[14px] transition-colors hover:bg-raised";

  return (
    <div className="recruiter mx-auto max-w-4xl px-6 pb-20 pt-28 print:max-w-none print:px-10 print:pb-0 print:pt-8">
      <header className="border-b border-line pb-8">
        <p className="font-mono text-[12.5px] uppercase tracking-[0.18em] text-accent print:hidden">Recruiter view · 30-second profile</p>
        <h1 className="mt-3 text-[clamp(34px,5vw,48px)] font-semibold leading-tight tracking-tightest">{SITE_NAME}</h1>
        <p className="mt-2 text-[19px] text-muted">
          Software engineer: backend systems, AI agent infrastructure and full-stack products.
          {current && <> Currently <span className="text-ink">{current.title}</span> at <span className="text-ink">{current.organisation}</span>.</>}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href={`mailto:${contact.email}`} className="inline-flex items-center rounded-full bg-ink px-4 py-1.5 text-[14px] font-medium text-page transition-opacity hover:opacity-85">{contact.email}</a>
          <a href={contact.github} target="_blank" rel="noopener" className={chip}>GitHub ↗</a>
          {contact.linkedin && <a href={contact.linkedin} target="_blank" rel="noopener" className={chip}>LinkedIn ↗</a>}
          <PrintButton className={`${chip} print:hidden`} />
        </div>
      </header>

      {work.length > 0 && (
        <section className="mt-10 break-inside-avoid">
          <H>Experience</H>
          <ul className="space-y-5">
            {work.map((e) => (
              <li key={e.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <p className="text-[17px] font-semibold">{e.title} <span className="font-normal text-muted">· {e.organisation}</span></p>
                  <span className="font-mono text-[13px] text-faint">{range(e)}</span>
                </div>
                {e.bullets && e.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {e.bullets.slice(0, 3).map((b, i) => (
                      <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-muted"><span className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-faint" />{b}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mt-10 break-inside-avoid">
          <H>Core skills</H>
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {skills.map((g) => (
              <div key={g.key} className="flex gap-3 text-[15px]">
                <dt className="w-28 shrink-0 font-medium" style={{ color: g.accent }}>{g.label}</dt>
                <dd className="text-muted">{g.names.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {gh && (
        <section className="mt-10 break-inside-avoid">
          <H>Open source</H>
          <p className="text-[15px] text-muted">
            <a href={gh.url} target="_blank" rel="noopener" className="font-medium text-ink hover:underline">github.com/{gh.login}</a>
            {" "}· {gh.publicRepos} public repositories · {gh.stars} stars{gh.since ? ` · active since ${gh.since}` : ""}
          </p>
          {gh.languages.length > 0 && <p className="mt-1.5 text-[15px] text-muted">Most used: {gh.languages.map((l) => `${l.name} (${l.repos})`).join(", ")}</p>}
          {gh.repos.length > 0 && (
            <p className="mt-1.5 text-[15px] text-muted">
              Recently pushed:{" "}
              {gh.repos.slice(0, 3).map((r, i) => (
                <span key={r.name}>{i > 0 && ", "}<a href={r.url} target="_blank" rel="noopener" className="text-ink hover:underline">{r.name}</a></span>
              ))}
            </p>
          )}
        </section>
      )}

      {featured.length > 0 && (
        <section className="mt-10">
          <H>Featured projects</H>
          <ul className="grid gap-3">
            {featured.map((p) => (
              <li key={p.id} className="card rounded-xl p-5 break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <Link href={`/projects/${p.slug}`} className="text-[17px] font-semibold hover:underline">{p.title}</Link>
                  <span className="flex gap-3 text-[13.5px] text-muted">
                    <Link href={`/projects/${p.slug}`} className="hover:text-ink">Case study</Link>
                    {p.repo_url && <a href={p.repo_url} target="_blank" rel="noopener" className="hover:text-ink">Code ↗</a>}
                    {p.demo_url && <a href={p.demo_url} target="_blank" rel="noopener" className="hover:text-ink">Live ↗</a>}
                  </span>
                </div>
                {(p.thesis ?? p.summary) && <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{p.thesis ?? p.summary}</p>}
                {techMap[p.id]?.length > 0 && <p className="mt-2 font-mono text-[12.5px] text-faint">{techMap[p.id].slice(0, 8).join(" · ")}</p>}
              </li>
            ))}
          </ul>
          <Link href="/projects" className="mt-3 inline-block text-[14px] text-muted hover:text-ink print:hidden">All {projects.length} projects →</Link>
        </section>
      )}

      {education.length > 0 && (
        <section className="mt-10 break-inside-avoid">
          <H>Education</H>
          <ul className="space-y-3">
            {education.map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-x-4">
                <p className="text-[16px]"><span className="font-semibold">{e.title}</span> <span className="text-muted">· {e.organisation}</span></p>
                <span className="font-mono text-[13px] text-faint">{range(e)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
