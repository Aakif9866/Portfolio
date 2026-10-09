import { requireAdmin } from "@/lib/auth";
import { saveRow } from "../actions";
import { SiteConfigRow } from "./row";

export default async function AdminSettings() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("site_config").select("*").order("group").order("position");
  const rows = (data ?? []) as { key: string; value: string | null; label: string | null; description: string | null; group: string | null; position: number }[];

  const groups = [...new Set(rows.map((r) => r.group ?? "general"))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Site config</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">
          {rows.length} keys. These are the strings the public pages read — editing one here changes
          the site, which is why there is no decorative setting in this list.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="card rounded-2xl px-6 py-10 text-center text-[13.5px] text-muted">
          No config keys yet. The public pages fall back to their built-in copy, so nothing breaks.
        </p>
      ) : (
        groups.map((g) => (
          <section key={g}>
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-faint">{g}</h2>
            <ul className="mt-3 space-y-2">
              {rows.filter((r) => (r.group ?? "general") === g).map((r) => (
                <li key={r.key}><SiteConfigRow row={r} action={saveRow} /></li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
