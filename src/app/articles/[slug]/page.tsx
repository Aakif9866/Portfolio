import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { supabasePublic } from "@/lib/supabase/server";
import { Markdown } from "@/components/markdown";
import { headings, readingMinutes } from "@/lib/markdown";
import { fullDate } from "@/lib/dates";
import type { Article } from "@/lib/types";
import { fetchOrThrow } from "@/lib/db";

export const revalidate = 300;

export async function generateStaticParams() {
  const { data } = await fetchOrThrow("article list", (s) => supabasePublic().from("articles").select("slug").abortSignal(s).eq("state", "published"));
  return (data ?? []).map((a) => ({ slug: a.slug }));
}

async function load(slug: string) {
  const { data } = await fetchOrThrow("article", (s) => supabasePublic()
    .from("articles").select("*, topics(name,slug)").abortSignal(s).eq("slug", slug).eq("state", "published").maybeSingle());
  return data as (Article & { topics: { name: string; slug: string } | null }) | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await load(slug);
  if (!a) return { title: "Not found" };
  return {
    title: a.title,
    description: a.dek ?? undefined,
    alternates: { canonical: `/articles/${a.slug}` },
    openGraph: { type: "article", title: a.title, description: a.dek ?? undefined, publishedTime: a.published_at ?? undefined, modifiedTime: a.updated_at },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [a, list] = await Promise.all([
    load(slug),
    fetchOrThrow("article neighbours", (s) => supabasePublic().from("articles").select("slug,title").abortSignal(s)
      .eq("state", "published").order("published_at", { ascending: false, nullsFirst: false })),
  ]);
  if (!a) notFound();

  const body = a.body_md ?? "";
  const toc = headings(body);
  const minutes = a.reading_minutes ?? (body ? readingMinutes(body) : null);
  const all = (list.data ?? []) as { slug: string; title: string }[];
  const i = all.findIndex((x) => x.slug === a.slug);
  const newer = i > 0 ? all[i - 1] : null;
  const older = i >= 0 && i < all.length - 1 ? all[i + 1] : null;

  return (
    <article>
      <div className="read-progress" aria-hidden />
      <header className="relative overflow-hidden spotlight border-b border-line pb-12 pt-32">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
        <div className="relative mx-auto max-w-3xl px-6">
          <Link href="/articles" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
            All writing
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2.5 font-mono text-[11.5px] uppercase tracking-wider text-faint">
            {a.topics && <span className="text-accent">{a.topics.name}</span>}
            {a.difficulty && <span>{a.difficulty}</span>}
            {minutes && <span>{minutes} min read</span>}
          </div>
          <h1 className="mt-4 text-[clamp(30px,5vw,46px)] font-semibold leading-[1.08] tracking-tightest">{a.title}</h1>
          {a.dek && <p className="mt-5 text-[18px] leading-relaxed text-muted">{a.dek}</p>}
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 font-mono text-[12px] text-faint">
            {a.published_at && <span>Published {fullDate(a.published_at)}</span>}
            {a.last_reviewed_at && <span>Reviewed {fullDate(a.last_reviewed_at)}</span>}
            {a.tested_with && <span>Tested with {a.tested_with}</span>}
          </div>
        </div>
      </header>

      <div className={`mx-auto px-6 py-14 ${toc.length >= 3 ? "max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-14" : "max-w-3xl"}`}>
        {toc.length >= 3 && (
          <nav aria-label="On this page" className="mb-10 lg:order-last lg:mb-0">
            <details className="rounded-xl border border-line p-4 lg:sticky lg:top-24 lg:border-0 lg:p-0" open>
              <summary className="cursor-pointer text-[12px] font-semibold uppercase tracking-[0.14em] text-faint lg:pointer-events-none lg:list-none">On this page</summary>
              <ol className="mt-3 space-y-1.5 text-[13.5px]">
                {toc.map((h) => (
                  <li key={h.id} className={h.depth === 3 ? "pl-3" : ""}>
                    <a href={`#${h.id}`} className="text-muted transition-colors hover:text-ink">{h.text}</a>
                  </li>
                ))}
              </ol>
            </details>
          </nav>
        )}
        <div className="mx-auto w-full max-w-[68ch]">
          {body ? <Markdown anchors>{body}</Markdown> : <p className="text-[14px] text-muted">This article has no body yet.</p>}

          {(newer || older) && (
            <nav aria-label="More writing" className="mt-16 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
              {older ? (
                <Link href={`/articles/${older.slug}`} className="card card-hover rounded-xl p-4">
                  <span className="block text-[12px] text-faint">Previous</span>
                  <span className="mt-1 block text-[15px] font-medium">{older.title}</span>
                </Link>
              ) : <span />}
              {newer && (
                <Link href={`/articles/${newer.slug}`} className="card card-hover rounded-xl p-4 text-right">
                  <span className="block text-[12px] text-faint">Next</span>
                  <span className="mt-1 block text-[15px] font-medium">{newer.title}</span>
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </article>
  );
}
