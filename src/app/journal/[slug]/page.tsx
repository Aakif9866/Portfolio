import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Toc } from "@/components/Toc";
import { PostRow } from "@/components/JournalList";
import { getPost, getPosts, relatedPosts } from "@/lib/journal";
import { categoryTone, tone } from "@/lib/tone";

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const post = await getPost((await params).slug);
  return post ? { title: post.title, description: post.summary, openGraph: { type: "article", title: post.title, description: post.summary } } : {};
}

export default async function ArticlePage({ params }: PageProps<"/journal/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const { default: Content } = await import(`@/content/journal/${slug}.mdx`);
  const related = relatedPosts(post, await getPosts());

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-28 sm:px-6 md:pt-36">
      <Link href="/journal" className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
        <ArrowLeft className="size-4" /> Journal
      </Link>

      <header style={tone(categoryTone[post.category] ?? "green")} className="mt-8 max-w-3xl">
        <p className="inline-block rounded-full bg-(--tone)/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-(--tone)">{post.category}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-heading md:text-5xl">{post.title}</h1>
        <p className="mt-4 font-mono text-xs text-muted">
          <time dateTime={post.date}>{post.date}</time> · {post.readingTime} min read · {post.tags.join(", ")}
        </p>
        {post.placeholder && (
          <p role="note" className="mt-6 rounded-md border border-line bg-surface p-3 text-sm text-muted">
            Sample placeholder article, included to demonstrate the journal layout. Replace it with your own writing.
          </p>
        )}
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_220px]">
        <article className="prose min-w-0 max-w-3xl">
          <Content />
        </article>
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <Toc headings={post.headings} />
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-20 max-w-3xl">
          <h2 id="related" className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Related articles</h2>
          <ul className="mt-4">{related.map((p) => <PostRow key={p.slug} post={p} />)}</ul>
        </section>
      )}
    </div>
  );
}
