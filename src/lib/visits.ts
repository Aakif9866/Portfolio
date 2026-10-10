import { supabasePublic, supabaseService } from "./supabase/server";

/**
 * The one metric this site tracks: total page views, stored as a single
 * site_config row. No new table, no per-visitor identity.
 *
 * ponytail: read-then-write, not atomic — concurrent requests can drop an
 * increment. Fine at portfolio traffic; upgrade to a Postgres RPC
 * (`increment_visit_count()`) if that ever matters.
 */
const KEY = "visit_count";

export async function recordVisit() {
  const supabase = supabaseService();
  const { data } = await supabase.from("site_config").select("value").eq("key", KEY).maybeSingle();
  const next = (Number(data?.value) || 0) + 1;
  // label is NOT NULL in site_config — only matters on the first-ever insert of this key.
  await supabase
    .from("site_config")
    .upsert({ key: KEY, value: String(next), label: "Visit count", group: "internal" }, { onConflict: "key" });
}

export async function getVisitCount(): Promise<number> {
  const { data } = await supabasePublic().from("site_config").select("value").eq("key", KEY).maybeSingle();
  return Number(data?.value) || 0;
}
