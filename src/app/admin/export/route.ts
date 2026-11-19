import { requireAdmin } from "@/lib/auth";
import type { Entry } from "@/lib/entries";
import { entriesToMarkdown } from "@/lib/export";

/**
 * Download the whole private workspace. JSON keeps every column (restorable); Markdown is one
 * readable file you can open anywhere. Admin only, never cached.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { supabase } = await requireAdmin();
  const format = new URL(request.url).searchParams.get("format") === "md" ? "md" : "json";

  // ponytail: one request, no paging; PostgREST caps at its max-rows (1000 by default). Page it past that.
  const [entries, config] = await Promise.all([
    supabase.from("entries").select("*").order("created_at", { ascending: true }),
    supabase.from("private_config").select("*"),
  ]);
  if (entries.error || config.error) {
    return new Response("Couldn't read the workspace. Has the migration been applied?", { status: 500 });
  }

  const date = new Date().toISOString().slice(0, 10);
  const headers = (type: string, ext: string) => ({
    "content-type": `${type}; charset=utf-8`,
    "content-disposition": `attachment; filename="workspace-${date}.${ext}"`,
    "cache-control": "no-store",
  });

  if (format === "md") return new Response(entriesToMarkdown(entries.data as Entry[]), { headers: headers("text/markdown", "md") });
  const body = { exported_at: new Date().toISOString(), entries: entries.data, private_config: config.data };
  return new Response(JSON.stringify(body, null, 2), { headers: headers("application/json", "json") });
}
