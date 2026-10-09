import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Reveal } from "@/components/reveal";
import { Empty } from "@/components/empty";
import { supabasePublic } from "@/lib/supabase/server";
import type { Article } from "@/lib/types";
import { staleness } from "@/lib/dates";

export const metadata: Metadata = { title: "Writing" };
export const revalidate = 300;

export default async function ArticlesPage() {
  const { data } = await supabasePublic()
    .from("articles").select("*, topics(name)").eq("state", "published")
    .order("published_at", { ascending: false, nullsFirst: false });
  const articles = (data ?? []) as (Article & { topics: { name: string } | null })[];

  return (
    <>
      <PageHeader
        eyebrow="Writing"
        title="Notes"
        lede="Technical notes on things I've had to work out properly. Each one records when it was last reviewed and what version it was tested against."
      />
      <section className="mx-auto max-w-4xl px-6 py-16">
        {articles.length === 0 ? (
          <Empty what="articles" />
        ) : (
          <ul className="divide-y divide-line">
            {articles.map((a, i) => (
              <Reveal key={a.id} delay={(i % 4) * 50}>
                <li>
                  <Link href={`/articles/${a.slug}`} className="group flex flex-col gap-2 py-6 transition-opacity hover:opacity-100">
                    <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11.5px] uppercase tracking-wider text-faint">
                      {a.topics && <span className="text-accent">{a.topics.name}</span>}
                      {a.difficulty && <span>{a.difficulty}</span>}
                      {a.reading_minutes && <span>{a.reading_minutes} min</span>}
                      {a.published_at && <span>{new Date(a.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
                      {staleness(a.last_reviewed_at) && (
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-600 dark:text-amber-400">Review needed</span>
                      )}
                    </div>
                    <h2 className="text-[21px] font-semibold tracking-tight transition-colors group-hover:text-accent">{a.title}</h2>
                    {a.dek && <p className="max-w-2xl text-[14.5px] leading-relaxed text-muted">{a.dek}</p>}
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
