import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabasePublic } from "@/lib/supabase/server";
import { CaseStudyView, loadCaseStudy } from "@/components/case-study";
import { fetchOrThrow } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

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
  const { title, slug: s } = d.project;
  const description = d.project.thesis ?? d.project.summary ?? undefined;
  return {
    title, description,
    alternates: { canonical: `/projects/${s}` },
    openGraph: { type: "website", title, description, url: `/projects/${s}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  return <CaseStudyView data={data} shareUrl={`${SITE_URL}/projects/${data.project.slug}`} />;
}
