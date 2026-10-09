import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Reveal } from "@/components/reveal";
import { Empty } from "@/components/empty";
import { supabasePublic } from "@/lib/supabase/server";
import type { Experiment } from "@/lib/types";

export const metadata: Metadata = { title: "Lab" };
export const revalidate = 300;

const TONE: Record<string, string> = {
  running: "#34d399", success: "#38bdf8", paused: "#fbbf24", failed: "#f43f5e", abandoned: "#8a8a93",
};

export default async function LabPage() {
  const { data } = await supabasePublic()
    .from("experiments").select("*").eq("state", "published").order("position");
  const experiments = (data ?? []) as Experiment[];

  return (
    <>
      <PageHeader
        eyebrow="Lab"
        title="Experiments"
        lede="Things I'm testing, with a hypothesis written down first. Failed and abandoned experiments stay published — that's the point of keeping a lab notebook."
      />
      <section className="mx-auto max-w-5xl px-6 py-16">
        {experiments.length === 0 ? (
          <Empty what="experiments" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {experiments.map((e, i) => {
              const tone = TONE[e.status] ?? "#8a8a93";
              return (
                <Reveal key={e.id} delay={(i % 2) * 70}>
                  <Link href={`/lab/${e.slug}`} className="card card-hover ring-grad group block h-full rounded-2xl p-6">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wider"
                        style={{ color: tone, background: `${tone}18` }}
                      >
                        <span className="h-1 w-1 rounded-full" style={{ background: tone }} />
                        {e.status}
                      </span>
                      {e.tags && e.tags.length > 0 && (
                        <span className="font-mono text-[11px] text-faint">{e.tags.slice(0, 2).join(" · ")}</span>
                      )}
                    </div>
                    <h2 className="mt-4 text-[19px] font-semibold tracking-tight">{e.title}</h2>
                    <p className="mt-2.5 text-[14px] leading-relaxed text-muted">{e.summary}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors group-hover:text-ink">
                      Read the notes
                      <svg className="h-3 w-3 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
