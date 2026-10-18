# AGENTS.md

Working rules for AI agents in this repo. Read [README.md](README.md) first — it is accurate and
current; this file only covers what the README doesn't: conventions, invariants and the checks to
run. Pending work and the migration runbook are in [docs/maintenance.md](docs/maintenance.md).

## The project in one line

Next.js 15 App Router portfolio whose content lives in Supabase Postgres, edited through
`/admin`, with RLS as the authorization source of truth.

## Non-negotiables

1. **Nothing ships that doesn't work end to end.** No fake buttons, placeholder CRUD, decorative
   settings, mock data or "coming soon". If it can't be done reliably, build a smaller real
   version and document the limitation.
2. **Never invent facts** about Aakif — employment, metrics, project capabilities. Content comes
   from the database or the resume. A missing metric is omitted or "Not measured".
3. **Never touch `.env` / `.env.local`,** never print secret values, never add a `NEXT_PUBLIC_`
   prefix to a server-only key.
4. **Never write to the production database** without explicit approval in that message. Schema
   changes go in `supabase/migrations/` and stay unapplied until approved.
5. **Don't delete or rewrite working code** to make a change easier.

## Invariants a change must not break

- **Every public-page query goes through `fetchOrThrow`** (`src/lib/db.ts`). Zero rows is an
  empty state; a failure throws rather than rendering an empty page. `tests/db-fetch.test.ts`
  fails if a public query bypasses it.
- **Public pages use `supabasePublic()`** (anon, no cookies, cacheable). Admin pages and Server
  Actions use `supabaseServer()`. `supabaseService()` is for the visit counter only — nothing
  else may bypass RLS.
- **Every admin page and Server Action calls `requireAdmin()`** (`src/lib/auth.ts`) — on top of
  RLS, never instead of it.
- **An admin-writable column must be declared in `src/lib/admin-fields.ts`.** That one definition
  is both the form and the server allowlist. `state`, `published_at`, `id` and timestamps are
  never settable through a normal save.
- **Publishing transitions** come from `src/lib/form.ts`; the server rejects anything else.
- **Navigation and status vocabulary lives in `src/lib/labels.ts`** — not inlined in components.
- **Public routes export `revalidate = 300`** and detail routes have `generateStaticParams`.

## Conventions

- TypeScript, Server Components by default; `"use client"` only for real interactivity (nav,
  command palette, theme toggle, reveal).
- Tailwind v4 with the CSS variables in `src/app/globals.css` (`page`, `surface`, `card`,
  `raised`, `line`, `ink`, `muted`, `faint`, `accent`). **No raw hex and no `gray-500`-style
  palette classes in components** — both themes come from those tokens.
- Dark mode is stepped surfaces, not black-and-white. Keep contrast ≥ 4.5:1.
- Accessibility is not optional: semantic HTML, visible focus, keyboard paths, labelled forms,
  no horizontal overflow at 320px. Respect `prefers-reduced-motion`.
- File-level comments explain *why* a module exists (see `db.ts`, `admin-fields.ts`) — match that
  density, don't narrate the obvious.
- Prefer the smallest change that works; reuse what's already in `src/lib` before adding a
  helper, and don't add a dependency for what a few lines do.

## Before reporting done

```bash
npm run lint
npm run typecheck
npm test          # offline, no database
npm run build     # when a public page or query changed
```

Report failures honestly, with the output. `node --env-file=.env.local scripts/check-rls.mjs` is
a read-only security check against the real database — run it after touching RLS, queries or the
Supabase clients.

## Git

- Branch off `main`; logical commits; don't commit on `main` and don't push unless asked.
- Never commit `.env*`, `.vercel/` or build output.
- A push to `main` deploys to production. Treat it as a release.

## Tooling notes

- The Supabase MCP server (`.mcp.json`) is for schema inspection, RLS checks and docs. It needs
  authorization in an interactive session.
- `index.html` at the root is a dead static page from v1, and `info.txt` is the original brief —
  neither is used by the app. Don't "fix" them.
