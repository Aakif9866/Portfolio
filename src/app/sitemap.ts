import type { MetadataRoute } from "next";
import { supabasePublic } from "@/lib/supabase/server";
import { fetchOrThrow } from "@/lib/db";
import { publishedArticles } from "@/lib/queries";
import { tagCounts } from "@/lib/blog";
import { NAV } from "@/lib/labels";
import { SITE_URL } from "@/lib/site";

/** Every public page, so search engines find new posts (and their tag pages) quickly. */
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = supabasePublic();
  const [articles, projects, experiments] = await Promise.all([
    publishedArticles(),
    fetchOrThrow("sitemap projects", (s) => sb.from("projects").select("slug,updated_at").abortSignal(s).eq("state", "published")),
    fetchOrThrow("sitemap experiments", (s) => sb.from("experiments").select("slug").abortSignal(s).eq("state", "published")),
  ]);
  const at = (path: string, lastModified?: string | null) => ({ url: `${SITE_URL}${path}`, ...(lastModified ? { lastModified } : {}) });
  return [
    at("/"),
    ...NAV.map((n) => at(n.href)),
    at("/recruiter"),
    ...articles.map((a) => at(`/articles/${a.slug}`, a.updated_at)),
    ...tagCounts(articles).map((t) => at(`/articles/tag/${t.slug}`)),
    ...((projects.data ?? []) as { slug: string; updated_at: string | null }[]).map((p) => at(`/projects/${p.slug}`, p.updated_at)),
    ...((experiments.data ?? []) as { slug: string }[]).map((e) => at(`/lab/${e.slug}`)),
  ];
}
