import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Markdown } from "@/components/markdown";
import { YouTube } from "@/components/youtube";
import { ShareBar } from "@/components/share-bar";
import { coverOf } from "@/components/article-list";
import { headings, readingMinutes } from "@/lib/markdown";
import { fullDate } from "@/lib/dates";
import { publishedArticles } from "@/lib/queries";
import { cleanTags, relatedPosts, tagSlug, youtubeId } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await publishedArticles()).map((a) => ({ slug: a.slug }));
}

async function load(slug: string) {
  const all = await publishedArticles();
  return { all, a: all.find((x) => x.slug === slug) ?? null };
}

/** Social preview: the cover, else the video thumbnail, else a generated card (./og). */
const shareImage = (a: { slug: string; cover_image_url?: string | null; video_url?: string | null }) =>
  coverOf(a) ?? `/articles/${a.slug}/og`;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { a } = await load(slug);
  if (!a) return { title: "Not found" };
  const image = shareImage(a);
  return {
    title: a.title,
    description: a.dek ?? undefined,
    keywords: cleanTags(a.tags),
    alternates: { canonical: `/articles/${a.slug}` },
    openGraph: {
      type: "article", title: a.title, description: a.dek ?? undefined, url: `/articles/${a.slug}`,
      publishedTime: a.published_at ?? undefined, modifiedTime: a.updated_at, tags: cleanTags(a.tags), authors: [SITE_NAME],
      images: [{ url: image, alt: a.title }],
      ...(youtubeId(a.video_url) ? { videos: [{ url: a.video_url! }] } : {}),
    },
    twitter: { card: "summary_large_image", title: a.title, description: a.dek ?? undefined, images: [image] },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { all, a } = await load(slug);
  if (!a) notFound();

  const body = a.body_md ?? "";
  const toc = headings(body);
  const minutes = a.reading_minutes ?? (body ? readingMinutes(body) : null);
  const tags = cleanTags(a.tags);
  const i = all.findIndex((x) => x.slug === a.slug);
  const newer = i > 0 ? all[i - 1] : null;
  const older = i >= 0 && i < all.length - 1 ? all[i + 1] : null;
  const related = relatedPosts(a, all);
  const url = `${SITE_URL}/articles/${a.slug}`;
  const videoId = youtubeId(a.video_url);
  const image = shareImage(a);

  // schema.org BlogPosting, so search engines show the post (and its video) properly.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.dek ?? undefined,
    url,
    mainEntityOfPage: url,
    datePublished: a.published_at ?? undefined,
    dateModified: a.updated_at,
    keywords: tags.join(", ") || undefined,
    image: image.startsWith("http") ? image : `${SITE_URL}${image}`,
    author: { "@type": "Person", name: SITE_NAME, url: SITE_URL },
    ...(videoId ? { video: { "@type": "VideoObject", name: a.title, description: a.dek ?? a.title, embedUrl: `https://www.youtube.com/embed/${videoId}`, contentUrl: a.video_url, thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, uploadDate: a.published_at ?? undefined } } : {}),
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="read-progress" aria-hidden />
      <header className="relative overflow-hidden spotlight border-b border-line pb-12 pt-32">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
        <div className="relative mx-auto max-w-3xl px-6">
          <Link href="/articles" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
            All writing
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2.5 font-mono text-[11.5px] uppercase tracking-wider text-faint">
            {a.video_url && <span className="text-accent">▶ Video</span>}
            {a.topics && <span className="text-accent">{a.topics.name}</span>}
            {a.difficulty && <span>{a.difficulty}</span>}
            {minutes && <span>{minutes} min read</span>}
          </div>
          <h1 className="mt-4 text-[clamp(30px,5vw,46px)] font-semibold leading-[1.08] tracking-tightest">{a.title}</h1>
          {a.dek && <p className="mt-5 text-[18px] leading-relaxed text-muted">{a.dek}</p>}
          {tags.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Tags">
              {tags.map((t) => (
                <li key={t}>
                  <Link href={`/articles/tag/${tagSlug(t)}`} className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[12px] text-muted transition-colors hover:bg-raised hover:text-ink">#{t}</Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 font-mono text-[12px] text-faint">
            <span>By {SITE_NAME}</span>
            {a.published_at && <time dateTime={a.published_at}>Published {fullDate(a.published_at)}</time>}
            {a.last_reviewed_at && <span>Reviewed {fullDate(a.last_reviewed_at)}</span>}
            {a.tested_with && <span>Tested with {a.tested_with}</span>}
          </div>
        </div>
      </header>

      {(a.video_url || a.cover_image_url) && (
        <div className="mx-auto max-w-4xl px-6 pt-10">
          {videoId ? (
            <YouTube url={a.video_url!} title={a.title} />
          ) : a.video_url ? (
            <a href={a.video_url} target="_blank" rel="noopener noreferrer" className="card card-hover flex items-center justify-between rounded-xl px-5 py-4 text-[15px] font-medium">
              ▶ Watch the video <span aria-hidden className="text-faint">↗</span>
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- covers can be hosted anywhere
            <img src={a.cover_image_url!} alt="" className="aspect-video w-full rounded-2xl border border-line object-cover" />
          )}
        </div>
      )}

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

          <div className="mt-14 border-t border-line pt-6">
            <ShareBar url={url} title={a.title} />
          </div>

          {related.length > 0 && (
            <section aria-labelledby="related-heading" className="mt-14">
              <h2 id="related-heading" className="text-[12px] font-semibold uppercase tracking-[0.14em] text-faint">Related</h2>
              <ul className="mt-4 grid gap-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/articles/${r.slug}`} className="card card-hover ring-grad block rounded-xl p-4">
                      <span className="block text-[15px] font-medium">{r.video_url ? "▶ " : ""}{r.title}</span>
                      {r.dek && <span className="mt-1 line-clamp-2 block text-[13.5px] text-muted">{r.dek}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(newer || older) && (
            <nav aria-label="More writing" className="mt-14 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
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
