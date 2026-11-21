import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { FlowDiagram } from "@/components/FlowDiagram";
import { GithubIcon } from "@/components/icons";
import { btn } from "@/components/LinkButtons";
import { getProject, projects } from "@/data/projects";
import { areaTone, tone } from "@/lib/tone";

export const generateStaticParams = () => projects.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const p = getProject((await params).slug);
  return p ? { title: p.title, description: p.tagline } : {};
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-line py-10 md:grid-cols-[220px_1fr]">
      <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-(--tone)">{title}</h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const p = getProject((await params).slug);
  if (!p) notFound();

  return (
    <article style={tone(areaTone[p.area])} className="mx-auto max-w-6xl px-4 pb-28 pt-28 sm:px-6 md:pt-36">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
        <ArrowLeft className="size-4" /> All projects
      </Link>
      <p className="mt-8 inline-block rounded-full bg-(--tone)/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-(--tone)">{p.area}</p>
      <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-heading md:text-5xl">{p.title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{p.tagline}</p>
      {(p.repo || p.demo) && (
        <div className="mt-8 flex flex-wrap gap-3">
          {p.repo && <a href={p.repo} target="_blank" rel="noreferrer" className={btn.ghost}><GithubIcon /> Repository</a>}
          {p.demo && <a href={p.demo} target="_blank" rel="noreferrer" className={btn.primary}>Live demo <ArrowUpRight className="size-4" /></a>}
        </div>
      )}

      <div className="mt-12">
        <Block title="Overview"><p className="max-w-3xl leading-relaxed">{p.overview}</p></Block>
        <Block title="Problem"><p className="max-w-3xl leading-relaxed">{p.problem}</p></Block>
        <Block title="Architecture"><FlowDiagram steps={p.architecture} label={`${p.title} architecture`} /></Block>
        <Block title="Stack">
          <p className="font-mono text-sm">{p.stack.join(" · ")}</p>
        </Block>
        <Block title="Key decisions">
          <dl className="grid gap-6 sm:grid-cols-2">
            {p.decisions.map((d) => (
              <div key={d.title}>
                <dt className="font-medium text-heading">{d.title}</dt>
                <dd className="mt-1 text-sm text-muted">{d.body}</dd>
              </div>
            ))}
          </dl>
        </Block>
        <Block title="Implementation">
          <ul className="space-y-2">
            {p.implementation.map((t) => (
              <li key={t} className="flex gap-3">
                <span aria-hidden className="mt-3 h-px w-3 shrink-0 bg-(--tone)" />
                {t}
              </li>
            ))}
          </ul>
        </Block>
        <Block title="Challenges & solutions">
          <dl className="space-y-6">
            {p.challenges.map((c) => (
              <div key={c.challenge}>
                <dt className="font-medium text-heading">{c.challenge}</dt>
                <dd className="mt-1 text-sm text-muted">{c.solution}</dd>
              </div>
            ))}
          </dl>
        </Block>
      </div>
    </article>
  );
}
