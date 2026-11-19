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
  await supabase.rpc("increment_visit_count");
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
