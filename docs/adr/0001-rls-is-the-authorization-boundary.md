# 1. Postgres RLS is the authorization boundary

Status: accepted · Recorded 2026-11-19 (the decision dates from the October 2026 rebuild)

## Context

The anon key ships to every browser, so anyone can call the Supabase API directly, without going
through the Next.js app. Any check that runs only in the app can be bypassed by calling the API.

## Decision

Postgres row-level security decides every read and write. Policies allow anon to read only
published rows, and give full access to users for whom `public.is_admin()` is true: their
`profiles.role` is `admin`, which sign-up assigns only to emails in `admin_allowlist`. The app talks to Postgres with the anon key plus the user's own
session (`supabaseServer()`), so RLS applies to the app's own queries too. `requireAdmin()` and
the middleware redirect are extra layers, never the only check. The service-role key is used
only by the visit counter.

## Alternatives

- **Checks in app code with a service-role connection**: one bug or one forgotten check in any
  route exposes everything, and the direct API stays wide open.
- **Admin role as a JWT claim**: needs a custom-claims hook, and revoking access means waiting
  for tokens to expire. An allowlist row takes effect immediately.

## Consequences

- Draft privacy holds even if the app has a bug. `scripts/check-rls.mjs` verifies it against
  production with SELECTs only.
- Policy changes are schema changes: they go in `supabase/migrations/` and need approval.
- The original policies were created in the dashboard and aren't in the repo yet
  (see [SECURITY.md](../../SECURITY.md#known-limits)).
