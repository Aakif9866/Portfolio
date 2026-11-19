# 2. Public queries go through a reliability wrapper

Status: accepted · Recorded 2026-11-19

## Context

`supabase-js` returns `{ data: null, error }` rather than throwing. A page that ignores `error`
renders "no projects", which looks like the content was deleted, and with static generation
that empty page gets cached and served for every visitor.

## Decision

Every public-page query goes through `fetchOrThrow` (`src/lib/db.ts`):

- zero rows is a real empty state;
- network errors and timeouts are retried (3 attempts, 8 s each, short back-off);
- query errors are not retried;
- anything still failing throws `DataUnavailableError`.

Logs carry only the query label, error code and attempt count.

## Alternatives

- **Check `error` in each page**: easy to forget, and one forgotten check is enough to break a page.
- **Show a fallback such as "No projects yet"**: hides the failure and gets cached.

## Consequences

- A failure during `next build` fails the build, so Vercel keeps the previous deployment. During
  ISR, Next keeps serving the last good page. On a first render, `error.tsx` shows a retry page.
- `tests/db-fetch.test.ts` fails if a public query bypasses the wrapper.
- A database outage during a deploy blocks the deploy. That's intended.
