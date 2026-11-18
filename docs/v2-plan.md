# v2 plan — Portfolio

## Context
The portfolio works but feels restricted, a little cluttered and slower than it should be. v2 (branch `v2`) does the following:
- makes the site lighter and faster;
- tidies the UI using the Klyro language from PLOS and the FDE portal (refs cloned to `~/Documents/ development/_refs/{plos,fde}`);
- adds an "SA" favicon on a radium violet → purple → pink gradient;
- turns on Supabase Storage;
- makes the blog a proper Markdown writing and reading experience;
- removes what won't be used.

`main` stays untouched until v2 is merged.

## Phase 0 — Safety net (done before plan mode, uncommitted)
- Tag `v1` on `main` (3efa9ee). Branch `v2` created.
- `scripts/backup-db.mjs`: a read-only, service-role SELECT of every PostgREST table into `backups/<ts>/*.json` plus a manifest. `backups` was added to `.gitignore`.
- Snapshot taken: `backups/2026-11-18T13-25-27-245Z/` (22 tables, 237 rows).
- `docs/v2-plan.md` was written. **Needs updating to match the decisions below** (keep 6 nav items; keep tables and builder pages).
- First commit on v2: these four files.

## Decisions (from you)
- Nav keeps all 6 items; only **Articles → Writing** is renamed in `src/lib/labels.ts` (URLs unchanged).
- Remove: the 9 obsolete `site_config` rows, `index.html`, `info.txt`, and the "Review needed after six months" article flag.
- Keep: the 9 unused tables and the 4 admin "Project builder" pages.
- Visit counter: keep it, but make it non-blocking and atomic.
- Blog editor: Write / Preview / Split.

## Phase 1 — Brand and declutter
- `src/app/icon.svg`: an "SA" monogram on `linear-gradient(#7c3aed → #a855f7 → #ec4899)`, legible at 16px. Next serves it automatically. Add `src/app/apple-icon.png` (180px), rendered once from the SVG.
- The nav brand in `src/components/nav.tsx` uses the same mark.
- `src/app/globals.css`:
  - keep the token names (`page`, `card`, `ink`, `accent`, etc.);
  - add `--grad` and `--corner`, taken from PLOS `globals.css`;
  - remove the `--grain`, `--spot`, `--glow` and `--sheen` effects and the `.spotlight` styles.
- The gradient is used only in these places: brand mark, 2px top strip, active-nav marker, and one primary CTA.
- Borders instead of heavy shadows; opposite-corner rounding on cards.
- Home `src/app/page.tsx`: trim the hero spacing (`pt-36`/`py-24`). Keep the existing sections but make them denser.
- Admin `src/app/admin/nav.tsx`: restyle to PLOS's sidebar (`plos/src/components/shell.tsx` pattern). Same groups and links.

## Phase 2 — Faster and lighter
Before any change, record a Lighthouse baseline on `/`, `/projects`, one case study and one article (mobile, local `next build && next start`). The numbers go into the README.

1. `src/middleware.ts`:
   - call `auth.getUser()` only when the path starts with `/admin` or equals `/login`;
   - take `(request, event: NextFetchEvent)` and record visits with `event.waitUntil(recordVisit())` instead of `await`.
2. `src/lib/visits.ts`: replace read-then-upsert with `supabaseService().rpc("increment_visit_count")`. The migration `supabase/migrations/<ts>_increment_visit_count.sql` adds an atomic `update … set value = (value::bigint+1)::text`. It is `security definer`, executable only by `service_role`, and includes a rollback block. Until it's applied, keep the current function as a fallback.
3. Search index: move `searchIndex()` out of `src/app/layout.tsx` into a route `src/app/search.json/route.ts` (`revalidate = 300`, still `fetchOrThrow`). `src/components/command-palette.tsx` fetches it the first time the palette opens.
4. Delete `src/components/reveal.tsx`. Replace its uses with a CSS `@keyframes` entrance gated by `prefers-reduced-motion`.
5. Re-measure and compare the client JS per route from `next build` output.

## Phase 3 — Supabase Storage
- Migration `<ts>_media_bucket.sql`:
  - a public-read bucket `media` (5 MB limit; image/* and application/pdf);
  - `storage.objects` insert, update and delete policies allowing only `auth.uid()` in `admin_allowlist` (the same predicate as the table policies);
  - a rollback block.
- `src/app/admin/actions.ts`:
  - `uploadMedia(formData)` checks `requireAdmin()`, validates MIME and size, and writes to the path `yyyy/<uuid>-<slug>.<ext>` with `supabaseServer()` (no service role). It returns the public URL.
  - `deleteMedia(path)` with the same checks.
- `next.config.ts`:
  - `experimental.serverActions.bodySizeLimit: "5mb"`;
  - add the Supabase host to `images.remotePatterns`.
- Admin UI:
  - `src/app/admin/ui.tsx` gets an `UploadButton` next to each `image_url` field. Field types come from `src/lib/admin-fields.ts`; add an `upload: true` flag on the hero and diagram image fields.
  - New page `src/app/admin/media/page.tsx`: a list of files with copy-URL and confirm-delete, plus a link in the admin nav.
- `scripts/check-rls.mjs`: add a read-only check that anon can't list or write private objects.

## Phase 4 — Markdown blog
**Admin editor.** New client component `src/app/admin/articles/editor.tsx`:
- Write / Preview / Split tabs, with Split on screens ≥1024px. The preview reuses `src/components/markdown.tsx`.
- Toolbar: H2, bold, italic, link, code, quote, list. Shortcuts ⌘B, ⌘K and ⌘S (⌘S submits).
- Pasting or dropping an image calls `uploadMedia` and inserts `![alt](url)`.
- Register it as the `markdown` field renderer for articles. Keep the revisions logic in `src/app/admin/articles/revisions.tsx` unchanged.

**Article fields:**
- Slug is filled automatically from the title.
- Add `tags text[]` and `cover_url` columns to `articles`; the migration is batched with the others. Declare both in `admin-fields.ts`.

**Reader** (`src/app/articles/[slug]/page.tsx` and `markdown.tsx`), modelled on FDE `views/Lesson.svelte`:
- A ~68ch reading column, with tightened `prose-doc` typography in `globals.css`.
- Heading ids and anchor links (a few lines inside the `components` map; no new dependency).
- A table of contents built from `##` and `###` (server-side extraction from `body_md`): sticky on desktop, a `<details>` element on mobile.
- Reading time, date and tags shown on the page.
- Code blocks: a language label, and a copy button (a tiny client component). Highlight theme tokens for both colour modes.
- GitHub-style callouts: `> [!NOTE]`, `[!TIP]` and `[!WARNING]`, implemented as a blockquote component that checks the first line.
- A reading-progress bar (CSS `animation-timeline: scroll()` with no JavaScript, plus a fallback).
- Previous and next article links.
- `src/app/feed.xml/route.ts`: an RSS feed. Per-article `generateMetadata` OG tags.
- Remove the 6-month "Review needed" flag (in `src/app/articles/*` and `labels.ts`).

## Phase 5 — Removals
- `git rm index.html info.txt`; remove their mentions in AGENTS.md and README.
- Delete the 9 obsolete `site_config` rows (list in `docs/maintenance.md` §2) with a migration file that includes a backup `select` and a rollback insert using the snapshot values.
- Apply the existing pending `20261017000000_atomic_reorder_and_revisions.sql` in the same window, and switch `actions.ts` over as `docs/maintenance.md` describes.

**One approval window for every DB change** (visit RPC, media bucket, article columns, site_config cleanup, atomic migration), in this order:
1. fresh `backup-db.mjs`;
2. `npx supabase db push --dry-run`;
3. your explicit OK;
4. `db push`.

## Phase 6 — Quality gates (roadmap file)
1. `.github/workflows/ci.yml`, adapted from `plos/.github/workflows/ci.yml`: lint, typecheck, test, build.
2. Playwright smoke tests (pattern from `plos/tests/e2e`):
   - a visitor sees published content only;
   - admin goes draft → preview → publish;
   - upload works.
3. `SECURITY.md` and 3–5 ADRs. Update the README with Lighthouse before/after numbers and screenshots.

## Reuse (don't re-implement)
| Need | Use |
| --- | --- |
| Public queries | `fetchOrThrow` (`src/lib/db.ts`) |
| Supabase clients | `supabasePublic`, `supabaseServer`, `supabaseService` (`src/lib/supabase/server.ts`) |
| Admin checks | `requireAdmin` (`src/lib/auth.ts`) |
| Admin writes | `saveRow` / `FIELDS` (`actions.ts`, `admin-fields.ts`) |
| Labels | `labels.ts` |
| Markdown rendering | the existing `Markdown` component |
| Styling patterns | PLOS tokens, shell and `ui.tsx` modal patterns |

## Verification
- Every phase: `npm run lint && npm run typecheck && npm test && npm run build`.
- New tests:
  - upload validation (MIME, size, path);
  - TOC extraction and callout parsing;
  - `search.json` uses `fetchOrThrow` (the existing `db-fetch.test.ts` guard covers this);
  - a migration SQL test for the visit RPC in PGlite, like `tests/migration-atomic.test.ts`.
- Manual (`npm run dev`, `SUPABASE_SERVICE_ROLE_KEY` invalid to avoid counting views):
  - favicon in the tab;
  - both themes at 320px and at desktop width;
  - the palette loads lazily (Network tab);
  - write an article with a pasted image, preview it, publish it; check the TOC, copy button and callouts;
  - upload and delete in Media.
- After DB apply: `node --env-file=.env.local scripts/check-rls.mjs`. Visit count increments, and pages are no longer delayed by it (TTFB compared to baseline).
- Lighthouse after each of Phase 1 and Phase 2, compared to the baseline.
- Push `v2` to get a Vercel preview, and review it there before any merge to `main`.
