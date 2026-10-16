import { requireAdmin } from "@/lib/auth";
import { saveRow } from "../actions";
import { AdminHeader } from "../ui";
import { SiteConfigRow } from "./row";
import { SITE_KEYS, isSiteKey } from "@/lib/site-content";

type Row = { key: string; value: unknown; label: string | null; group: string | null };

export default async function AdminSettings() {
  const { supabase, user } = await requireAdmin();
  const { data } = await supabase.from("site_config").select("key, value, label, group").order("group").order("position");
  const rows = (data ?? []) as Row[];
  const byKey = new Map(rows.map((r) => [r.key, r]));
  // visit_count is the visit counter's own storage, shown on the dashboard instead.
  const unused = rows.filter((r) => !isSiteKey(r.key) && r.key !== "visit_count");

  return (
    <div className="space-y-8">
      <AdminHeader title="Site content & access" description="Text and links used across the public site, and how access to this admin works." />

      <section aria-labelledby="content-h" className="space-y-3">
        <h2 id="content-h" className="text-[15px] font-semibold">Site content</h2>
        {SITE_KEYS.map((s) => {
          const r = byKey.get(s.key);
          return (
            <SiteConfigRow
              key={s.key}
              setting={s}
              exists={!!r && typeof r.value === "string" && r.value.trim() !== ""}
              value={typeof r?.value === "string" ? r.value : ""}
              action={saveRow}
            />
          );
        })}
      </section>

      <section aria-labelledby="access-h" className="card rounded-2xl p-5">
        <h2 id="access-h" className="text-[15px] font-semibold">Account & access</h2>
        <p className="mt-2 text-[14px] text-muted">Signed in as <span className="font-medium text-ink">{user.email}</span>.</p>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          There is one admin account and no public sign-up. Access is decided by the database itself: an
          email must be on the admin allowlist for any change to be accepted. The sign-in redirect and the
          server-side check on every page are extra layers on top of that, not the security boundary.
        </p>
      </section>

      {unused.length > 0 && (
        <details className="card rounded-2xl p-5">
          <summary className="cursor-pointer text-[14px] font-medium">Other stored settings ({unused.length}) — not used by the site</summary>
          <p className="mt-3 text-[13px] text-muted">
            These exist in the database from an earlier design, but no page reads them, so changing them would have no
            effect. They&apos;re shown read-only for reference and left untouched.
          </p>
          <ul className="mt-3 divide-y divide-line">
            {unused.map((r) => (
              <li key={r.key} className="py-2.5">
                <p className="text-[13.5px]">{r.label ?? r.key} <span className="font-mono text-[12px] text-muted">{r.key}</span></p>
                <p className="mt-0.5 truncate font-mono text-[12px] text-muted">{JSON.stringify(r.value)}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
