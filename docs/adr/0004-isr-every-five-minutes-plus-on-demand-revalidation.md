# 4. Static pages, refreshed every 5 minutes and on every admin write

Status: accepted · Recorded 2026-11-19

## Context

Content changes a few times a week and is read far more often than it's written. Pages should
be fast and cheap, and an edit should still appear promptly.

## Decision

Public routes are statically generated with `export const revalidate = 300`. Detail routes
(`/projects/[slug]`, `/articles/[slug]`, `/lab/[slug]`) use `generateStaticParams`. Admin
actions call `revalidatePath` for the pages a write affects (`revalidateFor` in
`src/app/admin/actions.ts`), so a save normally appears right away. The 5-minute timer is the
fallback for changes made outside the admin, such as in the Supabase dashboard. Public queries
use `supabasePublic()`, which sends no cookies, so the pages stay cacheable.

## Alternatives

- **Render on every request**: always fresh, but every page view waits on a database round
  trip, and an outage takes the site down instead of serving the last good page.
- **Fully static with redeploy on change**: a build for every typo fix.
- **Longer interval (for example 1 hour)**: fewer refreshes, but dashboard edits would take up
  to an hour to show.

## Consequences

- A dashboard edit can take up to 5 minutes to appear.
- Combined with [ADR 2](0002-public-queries-go-through-fetchorthrow.md), a failed refresh keeps
  the last good page instead of caching an empty one.
- Private workspace data is never revalidated onto a public path (`tests/privacy.test.ts`).
