import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { supabasePublic } from "@/lib/supabase/server";
import { Markdown } from "@/components/markdown";
import type { Experiment } from "@/lib/types";

export const revalidate = 300;

export async function generateStaticParams() {
  const { data } = await supabasePublic().from("experiments").select("slug").eq("state", "published");
  return (data ?? []).map((e) => ({ slug: e.slug }));
}

async function load(slug: string) {
  const sb = supabasePublic();
  const { data } = await sb.from("experiments").select("*, projects(slug,title)").eq("slug", slug).eq("state", "published").maybeSingle();
  return data as (Experiment & { projects: { slug: string; title: string } | null }) | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = await load(slug);
  return e ? { title: e.title, description: e.summary ?? undefined } : { title: "Not found" };
}

export default async function ExperimentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await load(slug);
  if (!e) notFound();

  const fmt = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : null);

  return (
    <article>
      <header className="relative overflow-hidden spotlight border-b border-line pb-12 pt-32">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
        <div className="relative mx-auto max-w-3xl px-6">
          <Link href="/lab" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
            Lab
          </Link>
          <h1 className="mt-6 text-[clamp(30px,5vw,46px)] font-semibold leading-[1.05] tracking-tightest">{e.title}</h1>
          <p className="mt-5 text-[17px] leading-relaxed text-muted">{e.summary}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[12px] text-faint">
            <span>Status: <span className="text-muted uppercase">{e.status}</span></span>
            {fmt(e.started_on) && <span>Started {fmt(e.started_on)}</span>}
            {fmt(e.ended_on) && <span>Ended {fmt(e.ended_on)}</span>}
            {e.projects && (
              <Link href={`/projects/${e.projects.slug}`} className="text-accent hover:underline">
                Related: {e.projects.title}
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-12 px-6 py-14">
        {e.hypothesis_md && (
          <section>
            <h2 className="mb-4 flex items-baseline gap-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-faint">
              <span className="h-px w-8 bg-line-strong" />Hypothesis
            </h2>
            <Markdown>{e.hypothesis_md}</Markdown>
          </section>
        )}
        {e.outcome_md ? (
          <section>
            <h2 className="mb-4 flex items-baseline gap-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-faint">
              <span className="h-px w-8 bg-line-strong" />Outcome
            </h2>
            <Markdown>{e.outcome_md}</Markdown>
          </section>
        ) : (
          <p className="card rounded-xl px-6 py-5 text-[13.5px] text-muted">
            No outcome recorded yet — this experiment is still {e.status}.
          </p>
        )}
        {e.tags && e.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-line pt-6">
            {e.tags.map((t) => (
              <span key={t} className="rounded-md border border-line bg-raised px-2 py-0.5 font-mono text-[11.5px] text-muted">{t}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
