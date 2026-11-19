import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Empty } from "@/components/empty";
import { ArticleList, TagCloud } from "@/components/article-list";
import { publishedArticles } from "@/lib/queries";
import { tagCounts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Writing",
  description: "Technical write-ups and the written companions to my videos.",
  alternates: { canonical: "/articles" },
};
export const revalidate = 300;

export default async function ArticlesPage() {
  const articles = await publishedArticles();

  return (
    <>
      <PageHeader
        eyebrow="Writing"
        title="Writing"
        lede="Technical write-ups on things I've had to work out properly, with what each was tested against so you can judge whether it still applies."
      />
      <section className="mx-auto max-w-4xl px-6 py-16">
        {articles.length === 0 ? (
          <Empty title="No articles published yet." body="Write-ups are on the way. Until then, each project's case study covers the engineering decisions in detail." action={{ href: "/projects", label: "Read the case studies" }} />
        ) : (
          <>
            <TagCloud tags={tagCounts(articles)} />
            <ArticleList articles={articles} />
            <p className="mt-10 text-[13px] text-faint">
              Follow along with <a href="/feed.xml" className="underline underline-offset-2 hover:text-ink">RSS</a>.
            </p>
          </>
        )}
      </section>
    </>
  );
}
