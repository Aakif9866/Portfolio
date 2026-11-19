import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Markdown } from "@/components/markdown";
import { supabasePublic } from "@/lib/supabase/server";
import { getContact } from "@/lib/contact";
import { fetchOrThrow } from "@/lib/db";
import { getGitHub, type GitHubSummary } from "@/lib/github";
import { fullDate } from "@/lib/dates";

export const metadata: Metadata = { title: "About" };
export const revalidate = 300;

export default async function AboutPage() {
  const [{ data }, contact] = await Promise.all([
    fetchOrThrow("About page text", (s) => supabasePublic().from("site_config").select("key,value").abortSignal(s).eq("key", "about_md").maybeSingle()),
    getContact(),
  ]);
  const body = typeof data?.value === "string" && data.value.trim() ? data.value : null;
  const github = await getGitHub(contact.github);

  return (
    <>
      <PageHeader eyebrow="About" title="About me" lede="Who I am, what I'm looking for, and how to reach me." />
      <div className="mx-auto grid max-w-5xl gap-12 px-6 py-14 lg:grid-cols-[1fr_280px]">
        <div>
          {body ? (
            <Markdown>{body}</Markdown>
          ) : (
            <div className="prose-doc">
              <p>
                I&apos;m a software engineer working across backend systems, AI agent infrastructure and
                full-stack products. The work I care about is the layer underneath the demo: request
                routing, failover, guardrails, object storage, idempotent sync, row-level security.
              </p>
              <p>
                This site is itself one of those systems. The content is served from a PostgreSQL
                database on Supabase, with row-level security policies that let anonymous visitors read
                published rows and nothing else. The admin area is a single account enforced by a
                database allowlist rather than a client-side flag.
              </p>
              <h2>What I&apos;m looking for</h2>
              <p>
                A software engineering role where I can work on real systems and be reviewed by people
                who are better than me. I&apos;d rather own one service properly than touch ten
                superficially.
              </p>
            </div>
          )}
          {github && <GitHubSection gh={github} />}
        </div>

        <aside aria-labelledby="contact-heading" className="lg:sticky lg:top-24 lg:self-start">
          <div className="card rounded-2xl p-6">
            <h2 id="contact-heading" className="text-[14px] font-semibold uppercase tracking-[0.14em] text-faint">Contact</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">Open to software engineering roles. Email is the fastest way to reach me.</p>
            <ul className="mt-5 space-y-2.5 text-[15px]">
              <li>
                <a href={`mailto:${contact.email}`} className="flex flex-col gap-0.5 rounded-lg bg-ink px-4 py-2.5 font-medium text-page transition-opacity hover:opacity-85">
                  Email <span className="break-all font-mono text-[13px] font-normal opacity-80">{contact.email}</span>
                </a>
              </li>
              <li>
                <a href={contact.github} target="_blank" rel="noopener" className="flex items-center justify-between rounded-lg border border-line px-4 py-2.5 transition-colors hover:bg-raised">
                  GitHub <span aria-hidden className="text-faint">↗</span>
                </a>
              </li>
              {contact.linkedin && (
                <li>
                  <a href={contact.linkedin} target="_blank" rel="noopener" className="flex items-center justify-between rounded-lg border border-line px-4 py-2.5 transition-colors hover:bg-raised">
                    LinkedIn <span aria-hidden className="text-faint">↗</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}

/** Live from the public GitHub API (src/lib/github.ts); left out entirely if GitHub can't be reached. */
function GitHubSection({ gh }: { gh: GitHubSummary }) {
  return (
    <section aria-labelledby="github-heading" className="mt-14">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="github-heading" className="text-[22px] font-semibold tracking-tight">On GitHub</h2>
        <a href={gh.url} target="_blank" rel="noopener" className="text-[14.5px] text-muted transition-colors hover:text-ink">
          @{gh.login} · {gh.publicRepos} public repos · {gh.followers} followers <span aria-hidden>↗</span>
        </a>
      </div>
      {gh.repos.length > 0 && (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {gh.repos.map((r) => (
            <li key={r.name}>
              <a href={r.url} target="_blank" rel="noopener" className="card flex h-full flex-col rounded-xl p-4 transition-colors hover:bg-raised">
                <span className="truncate font-mono text-[15px] font-medium">{r.name}</span>
                {r.description && <span className="mt-1.5 line-clamp-2 text-[14.5px] leading-relaxed text-muted">{r.description}</span>}
                <span className="mt-auto flex flex-wrap gap-x-3 pt-3 text-[13px] text-faint">
                  {r.language && <span>{r.language}</span>}
                  {r.stars > 0 && <span>★ {r.stars}</span>}
                  <span>Updated {fullDate(r.pushedAt)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
