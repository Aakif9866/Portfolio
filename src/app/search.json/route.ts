import { supabasePublic } from "@/lib/supabase/server";
import { fetchOrThrow } from "@/lib/db";
import { NAV } from "@/lib/labels";

/**
 * The command palette's index. Served as one cached JSON file that the palette fetches the
 * first time it opens, instead of being embedded in every page's HTML.
 */
export const revalidate = 300;

export async function GET() {
  const sb = supabasePublic();
  const [projects, articles, experiments, tech] = await Promise.all([
    fetchOrThrow("search index (projects)", (s) => sb.from("projects").select("slug,title").abortSignal(s).eq("state", "published")),
    fetchOrThrow("search index (articles)", (s) => sb.from("articles").select("slug,title").abortSignal(s).eq("state", "published")),
    fetchOrThrow("search index (experiments)", (s) => sb.from("experiments").select("slug,title").abortSignal(s).eq("state", "published")),
    fetchOrThrow("search index (technologies)", (s) => sb.from("technologies").select("slug,name,category").abortSignal(s)),
  ]);

  return Response.json([
    { label: "Home", href: "/", group: "Page" },
    ...NAV.map((n) => ({ label: n.label, href: n.href, group: "Page" })),
    ...(projects.data ?? []).map((p) => ({ label: p.title, href: `/projects/${p.slug}`, group: "Project" })),
    ...(articles.data ?? []).map((a) => ({ label: a.title, href: `/articles/${a.slug}`, group: "Article" })),
    ...(experiments.data ?? []).map((e) => ({ label: e.title, href: `/lab/${e.slug}`, group: "Experiment" })),
    ...(tech.data ?? []).map((t) => ({ label: t.name, href: `/system#${t.slug}`, group: "Tech", hint: t.category })),
  ]);
}
