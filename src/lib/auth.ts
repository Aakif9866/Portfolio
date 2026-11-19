import { cache } from "react";
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
export const requireAdmin = cache(async () => {
  const supabase = await supabaseServer();
  // The cookie names the account; getUser() then verifies the token with Supabase Auth, in
  // parallel with the allowlist lookup, so the gate costs one round trip instead of two.
  // cache(): the layout and the page share one check per request.
  const { data: { session } } = await supabase.auth.getSession();
  const email = session?.user.email;
  if (!email) redirect("/login");

  const [{ data: { user } }, { data: allowed }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("admin_allowlist").select("email").eq("email", email).maybeSingle(),
  ]);
  if (!user || user.email !== email) redirect("/login");
  if (!allowed) redirect("/login?error=not_authorised");
  return { supabase, user };
});
