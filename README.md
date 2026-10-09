# Portfolio — v2

Personal engineering portfolio. Next.js 15 App Router, Supabase (PostgreSQL + Auth),
Tailwind CSS v4. Every piece of content on the public site is a row in Postgres, served
through row-level security policies — there is no hard-coded content and no mock data.

## Running it

```bash
npm install
cp .env .env.local          # or let the keys you already have be read from .env.local
npm run dev                 # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (prerenders every published project, article and experiment) |
| `npm run lint` | ESLint via `next lint` |
| `npm run typecheck` | `tsc --noEmit` |
| `node --env-file=.env.local scripts/check-rls.mjs` | Security check — proves RLS, not the app, protects content |

Required env (`.env.local`):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`.

## Architecture

```
Browser
  │
  ├─ public routes ──── Server Components ──► anon Supabase client ──► Postgres
  │                     ISR, revalidate 300                             │
  │                                                                  RLS: state = 'published'
  │
  └─ /admin ─ middleware (session refresh + redirect)
              └─ Server Actions ──► session-bound client ──► Postgres
                                                              │
                                                           RLS: email ∈ admin_allowlist
```

**Public pages** use `supabasePublic()` — no cookie, so responses are cacheable and
revalidate every 5 minutes. **Admin pages and Server Actions** use `supabaseServer()`,
which carries the user's session so Postgres evaluates policies as that user.

### Why the content lives in Postgres

A portfolio that claims production thinking should survive someone reading its source.
Hard-coded JSX would have been less work and would have proved nothing. Putting it in a
database meant designing a schema, writing RLS policies, and building a real admin —
which is the actual subject of the site.

## Authorization

Three layers, only one of which is authoritative:

1. `middleware.ts` — redirects anonymous requests away from `/admin`. Convenience.
2. `requireAdmin()` in `src/lib/auth.ts` — re-checks server-side in every admin page and
   Server Action. Defence in depth.
3. **Postgres RLS policies joining `admin_allowlist`** — the real control. If layers 1 and
   2 were deleted, an anonymous client still could not write a row or read a draft.

`scripts/check-rls.mjs` asserts this in both directions: anon is refused inserts, updates,
drafts, `admin_allowlist` and `article_revisions`; the signed-in admin is granted exactly
what the UI needs. It exits non-zero on any failure.

There is exactly one admin account and no public registration. Admin membership is a row
in a table, not a client-side flag or a JWT claim the client could influence.

## Data model

Schema already existed in Supabase; this app was written against it rather than redesigning it.

| Table | Role |
| --- | --- |
| `projects` | case studies, with `state` (draft/published/archived) and ordering |
| `project_sections` | 17 canonical section kinds; only `published` ones render, in canonical order |
| `project_milestones` | dated timeline entries per project |
| `architecture_diagrams` | `nodes`/`edges` JSONB, rendered as an interactive SVG |
| `technologies` + `project_technologies` | the `/system` page and per-project tech lists |
| `articles` + `article_revisions` | notes; every save snapshots the previous body |
| `experiments` | `/lab`; failed and abandoned experiments stay published |
| `timeline_entries` | work and education |
| `site_config` | editable copy, keyed on `key` (upsert, not insert) |
| `admin_allowlist` | the authorization source of truth |

### Notes on specific decisions

- **Sections render in canonical order**, not insert order, so reordering in the admin
  cannot produce a case study that reads out of sequence.
- **`project_technologies` is fetched in one query** keyed by project id (`techByProject`)
  rather than per card, which would have been an N+1 on the projects index.
- **Article revisions snapshot before the write**, so restoring is itself a save that
  snapshots — restore is undoable.
- **Diagrams degrade to an ordered list under 768px.** A 900px canvas is unreadable on a
  phone and pinch-zoom is not a design.

## Design system

One token set in `src/app/globals.css`, redefined per theme — light and dark are the same
design, not two. Dark mode is true black (`#000`) with stepped surfaces
(page → surface → card → raised) and lit hairline top edges, plus a film-grain overlay
that stops large black areas banding. Theme is applied before first paint, so there is no
flash.

Motion is CSS-only: `IntersectionObserver` adds a class, `prefers-reduced-motion` disables
all of it. No animation library.

## What is deliberately not here

- **Analytics.** The visitor-counting design needs an `analytics_events` table that does
  not exist in this Supabase project. Rather than ship a dashboard with no data behind it,
  there is none.
- **GitHub sync.** Same reason — the `github_*` tables are not in the schema. Repository
  links are plain links.
- **CI/CD, E2E tests, error monitoring.** V2 items in the brief, not built. The security
  check script is real and runs; nothing here claims test coverage it does not have.

Empty tables produce an honest empty state that says the page is wired to the database,
rather than placeholder content.
