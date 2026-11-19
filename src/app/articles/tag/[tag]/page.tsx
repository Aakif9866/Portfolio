import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ArticleList, TagCloud } from "@/components/article-list";
import { publishedArticles } from "@/lib/queries";
import { cleanTags, tagCounts, tagSlug } from "@/lib/blog";

export const revalidate = 300;

export async function generateStaticParams() {
  return tagCounts(await publishedArticles()).map((t) => ({ tag: t.slug }));
}

async function load(tag: string) {
  const all = await publishedArticles();
  const tags = tagCounts(all);
  const current = tags.find((t) => t.slug === tag);
  const articles = all.filter((a) => cleanTags(a.tags).some((t) => tagSlug(t) === tag));
  return { tags, current, articles };
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const { current } = await load(tag);
  if (!current) return { title: "Not found" };
  return { title: `#${current.name}`, description: `Articles tagged ${current.name}.`, alternates: { canonical: `/articles/tag/${current.slug}` } };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const { tags, current, articles } = await load(tag);
  if (!current || articles.length === 0) notFound();

  return (
    <>
      <PageHeader eyebrow="Writing · Tag" title={`#${current.name}`} lede={`${articles.length} ${articles.length === 1 ? "article" : "articles"} tagged ${current.name}.`} />
      <section className="mx-auto max-w-4xl px-6 py-16">
        <TagCloud tags={tags} active={current.slug} />
        <ArticleList articles={articles} />
      </section>
    </>
  );
}
