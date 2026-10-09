import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Reveal } from "@/components/reveal";
import { Empty } from "@/components/empty";
import { supabasePublic } from "@/lib/supabase/server";
import type { TimelineEntry } from "@/lib/types";

export const metadata: Metadata = { title: "Experience" };
export const revalidate = 300;

const fmt = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : null);

function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative space-y-8 border-l border-line pl-8">
      {entries.map((e, i) => (
        <Reveal key={e.id} delay={i * 60}>
          <li className="relative">
            <span className="absolute -left-[41px] top-2 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-page" />
            <div className="card rounded-2xl p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-[18px] font-semibold tracking-tight">{e.title}</h3>
                <span className="font-mono text-[12px] text-faint">
                  {fmt(e.start_date)} — {fmt(e.end_date) ?? "Present"}
                </span>
              </div>
              <p className="mt-1 text-[14.5px] text-muted">
                {e.url ? (
                  <a href={e.url} target="_blank" rel="noopener" className="ul text-ink">{e.organisation}</a>
                ) : (
                  <span className="text-ink">{e.organisation}</span>
                )}
                {e.employment_type && <span className="text-faint"> · {e.employment_type}</span>}
                {e.location && <span className="text-faint"> · {e.location}{e.remote ? " (remote)" : ""}</span>}
              </p>
              {e.bullets && e.bullets.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {e.bullets.map((b, j) => (
                    <li key={j} className="flex gap-2.5 text-[14px] leading-relaxed text-muted">
                      <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-faint" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        </Reveal>
      ))}
    </ol>
  );
}

export default async function ExperiencePage() {
  const { data } = await supabasePublic()
    .from("timeline_entries").select("*").eq("state", "published")
    .order("start_date", { ascending: false, nullsFirst: false });
  const entries = (data ?? []) as TimelineEntry[];
  const work = entries.filter((e) => e.kind === "work");
  const education = entries.filter((e) => e.kind === "education");

  return (
    <>
      <PageHeader eyebrow="Experience" title="Where I've worked" lede="Reverse chronological. Current role first." />
      <div className="mx-auto max-w-4xl space-y-16 px-6 py-16">
        {entries.length === 0 && <Empty what="experience entries" />}
        {work.length > 0 && (
          <section>
            <h2 className="mb-7 text-[13px] font-semibold uppercase tracking-[0.14em] text-faint">Work</h2>
            <Timeline entries={work} />
          </section>
        )}
        {education.length > 0 && (
          <section>
            <h2 className="mb-7 text-[13px] font-semibold uppercase tracking-[0.14em] text-faint">Education</h2>
            <Timeline entries={education} />
          </section>
        )}
      </div>
    </>
  );
}
