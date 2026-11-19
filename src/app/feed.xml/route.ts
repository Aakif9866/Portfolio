import { supabasePublic } from "@/lib/supabase/server";
import { fetchOrThrow } from "@/lib/db";
import { rssFeed } from "@/lib/markdown";
import { SITE_URL } from "@/lib/site";

/** RSS 2.0 feed of published articles, refreshed with the rest of the site. */
export const revalidate = 300;


export async function GET() {
  const { data } = await fetchOrThrow("feed articles", (s) => supabasePublic().from("articles")
    // "*", not a column list: works before and after the article-media migration adds tags/video_url.
    .select("*").abortSignal(s)
    .eq("state", "published").order("published_at", { ascending: false, nullsFirst: false }).limit(50));
  const xml = rssFeed({ url: SITE_URL, title: "Aakif — Writing", description: "Technical write-ups on backend systems, AI infrastructure and full-stack products." }, data ?? []);
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
