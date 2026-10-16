import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Markdown } from "@/components/markdown";
import { supabasePublic } from "@/lib/supabase/server";
import { getContact } from "@/lib/contact";
import { fetchOrThrow } from "@/lib/db";

export const metadata: Metadata = { title: "About" };
export const revalidate = 300;

export default async function AboutPage() {
  const [{ data }, contact] = await Promise.all([
    fetchOrThrow("About page text", (s) => supabasePublic().from("site_config").select("key,value").abortSignal(s).eq("key", "about_md").maybeSingle()),
    getContact(),
  ]);
  const body = typeof data?.value === "string" && data.value.trim() ? data.value : null;

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
        </div>

        <aside aria-labelledby="contact-heading" className="lg:sticky lg:top-24 lg:self-start">
          <div className="card rounded-2xl p-6">
            <h2 id="contact-heading" className="text-[13px] font-semibold uppercase tracking-[0.14em] text-faint">Contact</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">Open to software engineering roles. Email is the fastest way to reach me.</p>
            <ul className="mt-5 space-y-2.5 text-[14px]">
              <li>
                <a href={`mailto:${contact.email}`} className="flex items-center justify-between gap-3 rounded-lg bg-ink px-4 py-2.5 font-medium text-page transition-opacity hover:opacity-85">
                  Email <span className="truncate font-normal opacity-80">{contact.email}</span>
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
