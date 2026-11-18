import { supabasePublic, supabaseService } from "./supabase/server";
import { fetchOrThrow } from "./db";

/**
 * The one metric this site tracks: total page views, stored as a single
 * site_config row. No new table, no per-visitor identity.
 *
 * Recorded from middleware via waitUntil, so it never delays a page.
 * One atomic call: increment_visit_count() (migration 20261118000000).
 */
const KEY = "visit_count";

export async function recordVisit() {
  const supabase = supabaseService();
  const { error } = await supabase.rpc("increment_visit_count");
  // PGRST202 = function not found: the migration isn't applied yet, so fall back.
  if (error?.code !== "PGRST202") return;

  // ponytail: fallback is read-then-write (can drop a count under concurrency); delete once the migration is live.
  const { data } = await supabase.from("site_config").select("value").eq("key", KEY).maybeSingle();
  const next = (Number(data?.value) || 0) + 1;
  // label is NOT NULL in site_config — only matters on the first-ever insert of this key.
  await supabase
    .from("site_config")
    .upsert({ key: KEY, value: String(next), label: "Visit count", group: "internal" }, { onConflict: "key" });
}

/**
 * Non-essential: if the count can't be read, return null so the UI omits it —
 * never a made-up 0, and never failing the whole page for a footer number.
 */
export async function getVisitCount(): Promise<number | null> {
  try {
    const { data } = await fetchOrThrow("visit count", (s) =>
      supabasePublic().from("site_config").select("value").abortSignal(s).eq("key", KEY).maybeSingle(), { attempts: 2 });
    return Number(data?.value) || 0;
  } catch {
    return null;
  }
}
