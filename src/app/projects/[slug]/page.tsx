import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabasePublic } from "@/lib/supabase/server";
import { CaseStudyView, loadCaseStudy } from "@/components/case-study";
import { fetchOrThrow } from "@/lib/db";

export const revalidate = 300;

export async function generateStaticParams() {
  const { data } = await fetchOrThrow("project list", (s) => supabasePublic().from("projects").select("slug").abortSignal(s).eq("state", "published"));
  return (data ?? []).map((p) => ({ slug: p.slug }));
}

const load = (slug: string) => loadCaseStudy(supabasePublic(), { slug, publishedOnly: true });

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await load(slug);
  if (!d) return { title: "Not found" };
  return { title: d.project.title, description: d.project.thesis ?? d.project.summary ?? undefined };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  return <CaseStudyView data={data} />;
}
