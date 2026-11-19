# 3. Server Actions for a single-writer CMS

Status: accepted · Recorded 2026-11-19

## Context

There is one writer, the admin. Writes are form saves, publish transitions, reordering, uploads
and the private workspace. There's no mobile app or third-party client that needs a public API.

## Decision

Every admin write is a Server Action (`src/app/admin/actions.ts`, `workspace-actions.ts`,
`ai-actions.ts`, `resume-actions.ts`). Each action calls `requireAdmin()`, then validates against
one declared allowlist: `src/lib/admin-fields.ts` for CMS tables and `src/lib/entries.ts` for
the workspace. The same definition drives both the form and the server check. Publishing goes
only through the transitions in `src/lib/form.ts`. After a write, the action calls
`revalidatePath` for the affected public paths.

## Alternatives

- **REST route handlers**: add a separate API to secure and keep in sync with no second client
  to justify it.
- **Writing to Supabase directly from the browser**: RLS would still protect the data, but
  validation, allowlisted columns and revalidation would move into client code anyone can skip.

## Consequences

- Fields that must never be set through a normal save (`state`, `published_at`, `id`, timestamps)
  are enforced in one place and tested in `tests/admin-rules.test.ts`.
- Next.js protects actions with an Origin check against CSRF. Arguments are still untrusted
  input, which is why every action validates them.
- Upload size is limited by the request body: 4 MB in the app, under Vercel's 4.5 MB limit.
