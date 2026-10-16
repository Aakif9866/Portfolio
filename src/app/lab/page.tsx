import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Reveal } from "@/components/reveal";
import { Empty } from "@/components/empty";
import { supabasePublic } from "@/lib/supabase/server";
import type { Experiment } from "@/lib/types";
import { StatusPill } from "@/components/project-card";
import { EXPERIMENT_STATUS } from "@/lib/labels";
import { fetchOrThrow } from "@/lib/db";

export const metadata: Metadata = { title: "Experiments" };
export const revalidate = 300;


export default async function LabPage() {
  const { data } = await fetchOrThrow("experiments", (s) =>
    supabasePublic().from("experiments").select("*").abortSignal(s).eq("state", "published").order("position"));
  const experiments = (data ?? []) as Experiment[];

  return (
    <>
      <PageHeader
        eyebrow="Experiments"
        title="Experiments"
        lede="Smaller technical tests, each with a hypothesis written down before the result. Failed and abandoned experiments stay published, because the reason they didn't work is usually the useful part."
      />
      <section className="mx-auto max-w-5xl px-6 py-16">
        {experiments.length === 0 ? (
          <Empty title="No experiments published yet." body="In the meantime, the projects show the larger pieces of work." action={{ href: "/projects", label: "Browse projects" }} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {experiments.map((e, i) => {
              return (
                <Reveal key={e.id} delay={(i % 2) * 70}>
                  <Link href={`/lab/${e.slug}`} className="card card-hover ring-grad group block h-full rounded-2xl p-6">
                    <div className="flex items-center justify-between gap-3">
                      <StatusPill status={e.status} map={EXPERIMENT_STATUS} />
                      {e.tags && e.tags.length > 0 && (
                        <span className="font-mono text-[11px] text-faint">{e.tags.slice(0, 2).join(" · ")}</span>
                      )}
                    </div>
                    <h2 className="mt-4 text-[19px] font-semibold tracking-tight">{e.title}</h2>
                    <p className="mt-2.5 text-[14px] leading-relaxed text-muted">{e.summary}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors group-hover:text-ink">
                      Hypothesis and outcome
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
