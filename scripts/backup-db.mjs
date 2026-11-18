/**
 * Full database snapshot — READ-ONLY.
 * Run: node --env-file=.env.local scripts/backup-db.mjs
 *
 * Writes backups/<timestamp>/<table>.json for every table PostgREST exposes, plus a
 * manifest with row counts. Uses the service role only to SELECT (drafts and private
 * tables are invisible to anon). Output is gitignored: it holds drafts and the admin
 * allowlist. Restore is a manual upsert per table — see docs/maintenance.md.
 */
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SERVICE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(2);
}

// The OpenAPI root lists every exposed table, so tables nobody remembered still get saved.
const spec = await fetch(`${URL}/rest/v1/`, { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } });
if (!spec.ok) {
  console.error(`Couldn't list tables (HTTP ${spec.status}).`);
  process.exit(1);
}
const tables = Object.keys((await spec.json()).definitions ?? {}).sort();

const db = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
const dir = `backups/${new Date().toISOString().replace(/[:.]/g, "-")}`;
mkdirSync(dir, { recursive: true, mode: 0o700 });

const manifest = { taken_at: new Date().toISOString(), tables: {} };
let failed = 0;
for (const table of tables) {
  const rows = [];
  // PostgREST caps a response at 1000 rows; page until a short page comes back.
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select("*").range(from, from + 999);
    if (error) { console.error(`  FAIL  ${table}: ${error.code ?? "error"}`); failed++; break; }
    rows.push(...data);
    if (data.length < 1000) break;
  }
  writeFileSync(`${dir}/${table}.json`, JSON.stringify(rows, null, 2), { mode: 0o600 });
  manifest.tables[table] = rows.length;
  console.log(`  ${String(rows.length).padStart(5)}  ${table}`);
}
writeFileSync(`${dir}/manifest.json`, JSON.stringify(manifest, null, 2), { mode: 0o600 });
console.log(`\nSaved ${tables.length} tables to ${dir}${failed ? ` — ${failed} failed` : ""}`);
process.exit(failed ? 1 : 0);
