import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";

/**
 * Gate for every admin route and Server Action.
 *
 * The real authorization lives in Postgres: RLS policies check the
 * admin_allowlist table. This is defence in depth — it stops an
 * unauthenticated request before it costs a round trip, and it makes the
 * redirect behaviour explicit. It is never the only check.
 */
export async function requireAdmin() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: allowed } = await supabase
    .from("admin_allowlist")
    .select("email")
    .eq("email", user.email!)
    .maybeSingle();

  if (!allowed) redirect("/login?error=not_authorised");
  return { supabase, user };
}
