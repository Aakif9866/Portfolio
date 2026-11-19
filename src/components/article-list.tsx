import Link from "next/link";
import type { Article } from "@/lib/types";
import { readingMinutes } from "@/lib/markdown";
import { fullDate } from "@/lib/dates";
import { cleanTags, tagSlug, youtubeId, youtubeThumb } from "@/lib/blog";

export type ListArticle = Article & { topics?: { name: string } | null };

/** The cover shown for a post: its own image, else its video's thumbnail. */
export const coverOf = (a: Pick<Article, "cover_image_url" | "video_url">) => {
  const id = youtubeId(a.video_url);
  return a.cover_image_url || (id ? youtubeThumb(id) : null);
};

/** Article rows for the Writing page and tag pages: meta line, title, summary, tags, cover. */
export function ArticleList({ articles }: { articles: ListArticle[] }) {
  return (
    <ul className="divide-y divide-line">
      {articles.map((a) => {
        const cover = coverOf(a);
        const minutes = a.reading_minutes ?? (a.body_md ? readingMinutes(a.body_md) : null);
        const tags = cleanTags(a.tags);
        return (
          <li key={a.id} className="rv py-6">
            <article className="flex gap-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11.5px] uppercase tracking-wider text-faint">
                  {a.video_url && <span className="text-accent">▶ Video</span>}
                  {a.topics && <span className="text-accent">{a.topics.name}</span>}
                  {a.difficulty && <span>{a.difficulty}</span>}
                  {minutes && <span>{minutes} min</span>}
                  {a.published_at && <time dateTime={a.published_at}>{fullDate(a.published_at)}</time>}
                </div>
                <h2 className="mt-2 text-[21px] font-semibold tracking-tight">
                  <Link href={`/articles/${a.slug}`} className="transition-colors hover:text-accent">{a.title}</Link>
                </h2>
                {a.dek && <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-muted">{a.dek}</p>}
                {tags.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
                    {tags.map((t) => (
                      <li key={t}>
                        <Link href={`/articles/tag/${tagSlug(t)}`} className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[11.5px] text-muted transition-colors hover:bg-raised hover:text-ink">#{t}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {cover && (
                <Link href={`/articles/${a.slug}`} tabIndex={-1} aria-hidden className="hidden w-40 shrink-0 sm:block">
                  {/* eslint-disable-next-line @next/next/no-img-element -- covers can be hosted anywhere */}
                  <img src={cover} alt="" loading="lazy" decoding="async" className="aspect-video w-full rounded-xl border border-line object-cover" />
                </Link>
              )}
            </article>
          </li>
        );
      })}
    </ul>
  );
}

/** Tag chips with counts, linking to each tag page; `active` marks the current one. */
export function TagCloud({ tags, active }: { tags: { name: string; slug: string; count: number }[]; active?: string }) {
  if (tags.length === 0) return null;
  return (
    <nav aria-label="Topics" className="mb-8 flex flex-wrap gap-2">
      <Link href="/articles" className={`rounded-full border px-3 py-1 text-[13px] transition-colors ${!active ? "border-ink bg-ink text-page" : "border-line text-muted hover:bg-raised hover:text-ink"}`}>All</Link>
      {tags.map((t) => (
        <Link key={t.slug} href={`/articles/tag/${t.slug}`} aria-current={active === t.slug ? "page" : undefined}
          className={`rounded-full border px-3 py-1 text-[13px] transition-colors ${active === t.slug ? "border-ink bg-ink text-page" : "border-line text-muted hover:bg-raised hover:text-ink"}`}>
          {t.name} <span className="opacity-60">{t.count}</span>
        </Link>
      ))}
    </nav>
  );
}
