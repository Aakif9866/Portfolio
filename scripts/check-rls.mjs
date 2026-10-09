/**
 * Security check: proves the database — not the app — is what protects content.
 * Run: node --env-file=.env.local scripts/check-rls.mjs
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anon = createClient(URL, ANON);
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

let failures = 0;
const check = (name, pass, detail = "") => {
  console.log(`${pass ? "  PASS" : "  FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures++;
};

console.log("\nRow-level security\n");

// 1. anon cannot write
{
  const { error } = await anon.from("projects").insert({ slug: `rls-probe-${Date.now()}`, title: "RLS probe" });
  check("anon INSERT into projects is rejected", !!error, error?.code ?? "NO ERROR — policy is open");
}

// 2. anon cannot update
{
  const { data: target } = await admin.from("projects").select("id,title").limit(1).single();
  const { data, error } = await anon.from("projects").update({ title: "hijacked" }).eq("id", target.id).select();
  check("anon UPDATE on projects changes nothing", !!error || (data ?? []).length === 0, error?.code ?? "0 rows");
}

// 3. anon cannot read a draft
{
  const slug = `rls-draft-${Date.now()}`;
  const { data: created, error: insErr } = await admin
    .from("projects").insert({ slug, title: "RLS draft probe", thesis: "Fixture row for the RLS check.", state: "draft" }).select("id").single();

  if (insErr) {
    check("create draft fixture", false, insErr.message);
  } else {
    const { data } = await anon.from("projects").select("id").eq("id", created.id);
    check("anon SELECT cannot see a draft project", (data ?? []).length === 0, `${(data ?? []).length} rows visible`);
    await admin.from("projects").delete().eq("id", created.id);
  }
}

// 4. anon can read published
{
  const { data, error } = await anon.from("projects").select("id").eq("state", "published");
  check("anon SELECT can read published projects", !error && (data ?? []).length > 0, `${data?.length ?? 0} rows`);
}

// 5. private tables stay private
for (const table of ["admin_allowlist", "article_revisions"]) {
  const { data, error } = await anon.from(table).select("*").limit(1);
  check(`anon cannot read ${table}`, !!error || (data ?? []).length === 0, error?.code ?? "0 rows");
}

// 6. the admin account can actually sign in
{
  const { data, error } = await anon.auth.signInWithPassword({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD ?? "",
  });
  if (!process.env.ADMIN_PASSWORD) {
    console.log("  SKIP  admin sign-in (set ADMIN_PASSWORD to run)");
  } else {
    check("admin can sign in", !error && !!data?.session, error?.message ?? data?.user?.email);
    if (data?.session) {
      const { error: wErr } = await anon.from("projects").update({ position: 0 }).eq("state", "published").select();
      check("signed-in admin CAN write", !wErr, wErr?.message ?? "update accepted");

      // requireAdmin() depends on this read succeeding for the admin itself.
      const { data: allow, error: aErr } = await anon.from("admin_allowlist").select("email").eq("email", process.env.ADMIN_EMAIL).maybeSingle();
      check("signed-in admin CAN read its own allowlist row", !aErr && !!allow, aErr?.message ?? JSON.stringify(allow));

      // a draft must be visible to the admin, or the admin UI cannot edit it
      const { data: drafts, error: dErr } = await anon.from("projects").select("id").eq("state", "draft");
      check("signed-in admin CAN see drafts", !dErr, dErr?.message ?? `${drafts?.length ?? 0} rows`);

      await anon.auth.signOut();
    }
  }
}

console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED.`}\n`);
process.exit(failures === 0 ? 0 : 1);
