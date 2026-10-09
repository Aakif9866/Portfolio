import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { supabasePublic } from "@/lib/supabase/server";
import { Markdown } from "@/components/markdown";
import { staleness } from "@/lib/dates";
import type { Article } from "@/lib/types";

export const revalidate = 300;

export async function generateStaticParams() {
  const { data } = await supabasePublic().from("articles").select("slug").eq("state", "published");
  return (data ?? []).map((a) => ({ slug: a.slug }));
}

async function load(slug: string) {
  const { data } = await supabasePublic()
    .from("articles").select("*, topics(name,slug)").eq("slug", slug).eq("state", "published").maybeSingle();
  return data as (Article & { topics: { name: string; slug: string } | null }) | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await load(slug);
  return a ? { title: a.title, description: a.dek ?? undefined } : { title: "Not found" };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await load(slug);
  if (!a) notFound();

  return (
    <article>
      <header className="relative overflow-hidden spotlight border-b border-line pb-12 pt-32">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
        <div className="relative mx-auto max-w-3xl px-6">
          <Link href="/articles" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
            Writing
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2.5 font-mono text-[11.5px] uppercase tracking-wider text-faint">
            {a.topics && <span className="text-accent">{a.topics.name}</span>}
            {a.difficulty && <span>{a.difficulty}</span>}
            {a.reading_minutes && <span>{a.reading_minutes} min read</span>}
          </div>
          <h1 className="mt-4 text-[clamp(30px,5vw,46px)] font-semibold leading-[1.06] tracking-tightest">{a.title}</h1>
          {a.dek && <p className="mt-5 text-[17.5px] leading-relaxed text-muted">{a.dek}</p>}
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 font-mono text-[12px] text-faint">
            {a.published_at && <span>Published {new Date(a.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
            {a.last_reviewed_at && <span>Reviewed {new Date(a.last_reviewed_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>}
            {a.tested_with && <span>Tested with {a.tested_with}</span>}
          </div>
          {staleness(a.last_reviewed_at) && (
            <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-700 dark:text-amber-300">
              <strong className="font-semibold">Review needed.</strong> This note has not been checked in
              over six months. Details may be out of date.
            </p>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-14">
        {a.body_md ? <Markdown>{a.body_md}</Markdown> : <p className="text-[14px] text-muted">This note has no body yet.</p>}
      </div>
    </article>
  );
}
