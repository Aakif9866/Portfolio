/**
 * Production RLS smoke check — READ-ONLY.
 * Run: node --env-file=.env.local scripts/check-rls.mjs
 *
 * Every request here is a SELECT. Nothing inserts, updates, deletes, calls an
 * RPC or signs in, so it is safe to point at the live database. Anything that
 * needs to write (fixtures, admin/non-admin sessions, publish workflows) lives
 * in tests/db and runs only against a local Supabase — see tests/support/guard.ts.
 * tests/unit/check-rls-readonly.test.ts fails the build if a write sneaks back in.
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !ANON || !SERVICE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(2);
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const anon = createClient(URL, ANON, opts);
// service_role is used only to READ the ground truth anon is compared against.
const truth = createClient(URL, SERVICE, opts);

let failures = 0;
const check = (name, pass, detail = "") => {
  console.log(`${pass ? "  PASS" : "  FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures++;
};
const skip = (name, why) => console.log(`  SKIP  ${name} — ${why}`);

console.log("\nRow-level security (read-only, production-safe)\n");

// 1. published content is readable
{
  const { data, error } = await anon.from("projects").select("id").eq("state", "published");
  check("anon can read published projects", !error && (data ?? []).length > 0, error?.message ?? `${data?.length ?? 0} rows`);
}

// 2. nothing unpublished is visible on any table that has a state column
for (const table of ["projects", "articles", "experiments", "timeline_entries"]) {
  const { data, error } = await anon.from(table).select("id").neq("state", "published");
  check(`anon sees no unpublished ${table}`, !error && (data ?? []).length === 0, error?.message ?? `${data?.length ?? 0} rows`);
}
{
  const { data, error } = await anon.from("project_sections").select("id").neq("state", "published");
  check("anon sees no unpublished project_sections", !error && (data ?? []).length === 0, error?.message ?? `${data?.length ?? 0} rows`);
}

// 3. children of unpublished projects stay hidden
{
  const { data: hidden } = await truth.from("projects").select("id").neq("state", "published");
  const ids = (hidden ?? []).map((p) => p.id);
  for (const table of ["project_sections", "architecture_diagrams", "project_milestones", "project_technologies"]) {
    if (ids.length === 0) { skip(`anon cannot see ${table} of unpublished projects`, "no unpublished projects in this database; covered by tests/db"); continue; }
    const { data, error } = await anon.from(table).select("project_id").in("project_id", ids);
    check(`anon cannot see ${table} of unpublished projects`, !error && (data ?? []).length === 0, error?.message ?? `${data?.length ?? 0} rows`);
  }
}

// 4. private tables stay private
for (const table of ["admin_allowlist", "article_revisions", "profiles"]) {
  const { data, error } = await anon.from(table).select("*").limit(1);
  check(`anon cannot read ${table}`, !!error || (data ?? []).length === 0, error?.code ?? "0 rows");
}

console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED.`}\n`);
process.exit(failures === 0 ? 0 : 1);
