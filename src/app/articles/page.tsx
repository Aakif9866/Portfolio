import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Empty } from "@/components/empty";
import { supabasePublic } from "@/lib/supabase/server";
import type { Article } from "@/lib/types";
import { readingMinutes } from "@/lib/markdown";
import { fetchOrThrow } from "@/lib/db";

export const metadata: Metadata = { title: "Writing" };
export const revalidate = 300;

export default async function ArticlesPage() {
  const { data } = await fetchOrThrow("articles", (s) => supabasePublic()
    .from("articles").select("*, topics(name)").abortSignal(s).eq("state", "published")
    .order("published_at", { ascending: false, nullsFirst: false }));
  const articles = (data ?? []) as (Article & { topics: { name: string } | null })[];

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
          <ul className="divide-y divide-line">
            {articles.map((a, i) => (
              <li key={a.id} className="rv">
                  <Link href={`/articles/${a.slug}`} className="group flex flex-col gap-2 py-6 transition-opacity hover:opacity-100">
                    <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11.5px] uppercase tracking-wider text-faint">
                      {a.topics && <span className="text-accent">{a.topics.name}</span>}
                      {a.difficulty && <span>{a.difficulty}</span>}
                      {(a.reading_minutes ?? (a.body_md ? readingMinutes(a.body_md) : null)) && <span>{a.reading_minutes ?? readingMinutes(a.body_md ?? "")} min</span>}
                      {a.published_at && <span>{new Date(a.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
                    </div>
                    <h2 className="text-[21px] font-semibold tracking-tight transition-colors group-hover:text-accent">{a.title}</h2>
                    {a.dek && <p className="max-w-2xl text-[14.5px] leading-relaxed text-muted">{a.dek}</p>}
                  </Link>
                </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
