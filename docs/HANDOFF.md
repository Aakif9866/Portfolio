# Handoff — v2 development

**Read this first when the user says "continue".** Then pick up at **Next steps** below and
keep going without re-asking anything listed under **Decisions already made**. Update this
file (status table and next steps) at the end of every session.

Last updated: 2026-11-19 (session 4).

## Where things are

- Branch **`v2`** (all work), off `main`. `main` is untouched and tagged **`v1`** (rollback point).
  Nothing has been pushed. **Don't push or merge without the user asking.** A push to `main` deploys production.
- Plans: [`docs/v2-plan.md`](v2-plan.md) (site rework) and [`docs/workspace-plan.md`](workspace-plan.md)
  (private workspace). The README describes what exists now.
- DB snapshot before any change: `backups/2026-11-18T13-25-27-245Z/` (gitignored). Take a new one with
  `node --env-file=.env.local scripts/backup-db.mjs`.
- Reference repos (UI inspiration): `~/Documents/ development/_refs/{plos,fde}`.

## Status

| Phase | Commit | State |
| --- | --- | --- |
| v2-1 SA favicon, brand gradient, declutter | `0bc0c9f` | ✅ done |
| v1 look restored (user preferred it): grain, aurora, spotlight+grid, glass, lifting cards, v1 text gradient; SA mark and accents in v1 rose→violet | see log | ✅ done |
| v2-2 speed (non-blocking middleware, lazy search, static /projects) | `6ffb86d` | ✅ done |
| v2-3 Supabase Storage uploads + Media page | `1c2b21d` | ✅ code done · ⏳ migration |
| W0 private inbox + quick capture + export | `1dfad33` | ✅ code done · ⏳ migration |
| W1 resources, logs, ideas board, weekly recap | `9f44417` | ✅ code done |
| W3 job tracker | `3f9c6df` | ✅ code done |
| W2 career + skills | `a962750` | ✅ code done |
| W4 AI help (DeepSeek, optional) | `96c814c` | ✅ code done · ⏳ API key |
| W5 resume builder (PDF via print, .tex) | `0d93a7e` | ✅ code done · `.tex` not compile-tested |
| v2-4 Markdown editor + article reader + RSS | `2acfe91` | ✅ done |
| Fix visit migration (value is jsonb) | `d838e1f` | ✅ done |
| v2-5 removals (files + site_config migration) | `a0f3b13` | ✅ code done · ⏳ migration |
| v2-6 CI workflow + Playwright visitor smoke tests | `26e0dda`, `4d2c005` | ✅ done |
| **Apply pending migrations (5)** | — | ⏳ **blocked on the user** |
| v2-6 SECURITY.md, 4 ADRs, README screenshots | `ca045bb`, next | ✅ done |

**Nothing in the workspace (`/admin` inbox, resources, logs, ideas, jobs, career, skills, resume) works on a
real database until the migrations are applied.** Pages show "the workspace tables don't exist yet" until then.

## Next steps (in order)

### 1. Apply the 6 pending migrations — needs the user
Runbook: [`docs/maintenance.md` §0](maintenance.md). Files in `supabase/migrations/`:
`20261017000000_atomic_reorder_and_revisions.sql`, `20261118000000_increment_visit_count.sql`,
`20261119000000_media_storage_policies.sql`, `20261119000001_workspace_entries.sql`,
`20261119000002_remove_obsolete_site_config.sql` (data delete; rollback insert in the file),
`20261119000003_article_media.sql` (article tags/cover/video; **until applied, saving an article in the admin fails**).
The visit migration was fixed on 2026-11-19: it assumed `site_config.value` was text, but it's jsonb.

**Approved by the user on 2026-11-19** ("do a migration"). Blocked only on credentials: `SUPABASE_DB_PASSWORD` in
`.env` held a URL, not the DB password; the user is fixing it. Connect without `supabase login` via the IPv4 pooler
(the direct host is IPv6-only and unreachable here): `aws-0-ap-south-1.pooler.supabase.com:5432`, user
`postgres.yajgzliiwwkvqvsfqtfs`, password from `.env` through `PGPASSWORD` (never echo it), e.g.
`npx supabase db push --db-url "postgresql://postgres.yajgzliiwwkvqvsfqtfs:<urlencoded pw>@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"`.
Fresh snapshot: `backups/2026-11-19T12-39-18-728Z/`. Dry-run first; stop if it lists anything but the 6 files.
```bash
node --env-file=.env.local scripts/backup-db.mjs        # fresh snapshot (you can run this)
npx supabase login                                      # user: opens a browser
npx supabase link --project-ref yajgzliiwwkvqvsfqtfs    # user: asks for the DB password
npx supabase db push --dry-run                          # show output, get explicit OK
npx supabase db push
```
Before pushing, inspect existing storage policies (the media migration notes the query). Afterwards:
- do the §1 app switch-over in `src/app/admin/actions.ts` (`reorder()` → `rpc("swap_positions")`;
  `saveArticle` → `saveRow`), as described in `docs/maintenance.md` §1;
- delete the read-then-write fallback in `src/lib/visits.ts` (marked `ponytail:`);
- run `node --env-file=.env.local scripts/check-rls.mjs` (anon must see 0 rows in `entries` and
  `private_config`, and can't list `media`);
- click through: capture a link and a note, edit one, export JSON, upload and delete a file, create the
  resume master. Then update this file.

If the user authorizes the Supabase MCP (`/mcp`), use it for read-only checks first.

### 2. v2-6 remaining
- **Decided: no CI secrets.** CI runs lint, typecheck and unit tests; build + e2e are skipped unless
  `NEXT_PUBLIC_SUPABASE_URL` is set as a secret. Run build + e2e locally before pushing.
- About page shows public GitHub data (`src/lib/github.ts`): unauthenticated API, read-only, cached 1 h, hidden on
  failure. The user wants it kept to a basic API call and display, so no token, charts or sync.
- Admin Playwright journeys need a test account — ask the user before adding any.
- Screenshots (`docs/screenshots/`) were taken from a local `next start` against the live DB; retake after visual changes.
- Done in session 4: link previews re-check every redirect hop and resolved IPs, and refuse IPv4-mapped IPv6;
  the project facts row fills its width (no empty cells).
- Possible next work (ask first): a baseline migration capturing the dashboard-created schema so a fresh DB can
  be built. It needs a schema dump (`npx supabase db dump --schema public`, after `link`) or the Supabase MCP.
- Gotcha: `pkill -f "next start"` misses the server (its process is named `next-server`). Stop it by port:
  `kill $(lsof -tiTCP:3100 -sTCP:LISTEN)`.

### Small follow-ups noticed
- Vercel env: set `NEXT_PUBLIC_SITE_URL=https://portfolio-pi-weld-92.vercel.app` (local `.env.local` has
  `localhost:3000`, so feed links would point there). Add `DEEPSEEK_API_KEY` to enable AI (W4/W5).
- Compile one exported `.tex` resume on Overleaf; fix the preamble if needed (`src/lib/resume.ts`).
- Not built (deferred on purpose): log → "promote to case study"; W6 ideas (semantic search, knowledge graph,
  reminders, Excalidraw).

## Decisions already made (don't re-ask)

- **Blog = companion to the user's future YouTube channel.** Built: companion video per post, in-text YouTube
  embeds, tags + tag pages, related posts, cover images, share links, OG cards, JSON-LD, sitemap/robots, RSS
  categories. Not built (ask before adding): comments (giscus needs a public repo with Discussions),
  email newsletter, series/playlists.

- **Visual theme = v1** (tag `v1`): the user disliked the v2 declutter. Keep v1 effects; new UI should use them.
- **Type:** Geist (text/headings), Geist Mono (labels, meta, code), Instrument Serif italic for highlights
  (`.grad-text`, `.font-accent`: article summaries, home stats, blockquotes), self-hosted via `next/font`. Public
  text was bumped one step; prose is 18px in v1's muted colour. Verified against a v1 build: backgrounds match
  (0.2% pixel diff = logo/nav label).
- **Navigation sluggishness root cause (measured 2026-11-19):** the *live* site is v1: `/projects` takes 2.3–3.3 s
  (cache MISS, rendered per request) and a nav click 1.85 s + 0.6 s fade. v2 swaps pages in ~55 ms. Deploying v2
  is the fix (needs the user's OK to merge/push; a push to `main` deploys). Page headers no longer fade in on
  every navigation; only the home hero animates.
- **Speed:** pages are static (4–25 ms TTFB vs v1's 90–690 ms). The aurora glow renders at 1/4 size ×4 scale;
  don't add `will-change` to it (measured: dropped scroll frames). Entrance animations are 0.35 s.

- Nav keeps all 6 items; "Articles" is labelled **Writing** (URLs unchanged).
- Keep the 9 unused tables and the admin Project builder pages. Remove the 9 obsolete `site_config` rows,
  `index.html`, `info.txt`, and the six-month article flag (flag already removed).
- Visit counter: keep, non-blocking (`waitUntil`) and atomic (RPC).
- Workspace scope: **career things here, daily life/to-dos/habits stay in PLOS** (the inbox links to PLOS).
- AI: **DeepSeek** default via OpenAI-compatible fetch (`src/lib/ai.ts`); env `AI_API_KEY`/`DEEPSEEK_API_KEY`,
  `AI_BASE_URL`, `AI_MODEL`, `AI_MONTHLY_TOKEN_CAP`. Prompts use only the entry pressed on, never salary or career profile.
- Out of scope: mobile share-sheet capture, Gmail, LinkedIn/Instagram integrations.
- `rea` (morluto/rea) is a dev-time reverse-engineering MCP tool, never a runtime dependency.
- Goals link to resources and logs **by shared tags** (no `entry_links` table). Resumes are stored in
  `private_config` (`resume.master`, `resume.v.<12hex>`), no `resumes` table.
- Workspace search is substring (`ilike`), not full-text.

## How the code is organised (new in v2)

| Area | Files |
| --- | --- |
| Workspace rules (pure, tested) | `src/lib/entries.ts`, `career.ts`, `resume.ts`, `ai.ts`, `ai-prompts.ts`, `markdown.ts`, `media.ts`, `export.ts`, `fetch-page.ts` |
| Workspace server actions | `src/app/admin/workspace-actions.ts`, `ai-actions.ts`, `resume-actions.ts`; uploads in `actions.ts` |
| Workspace pages | `src/app/admin/{page.tsx (Inbox),resources,logs,ideas,jobs,career,skills,resume,recap,media,export}` |
| Shared admin UI | `ui.tsx`, `entry-editor.tsx`, `workspace-ui.tsx`, `capture.tsx`, `markdown-editor.tsx`, `ai-panel.tsx` |
| Migrations (unapplied) | `supabase/migrations/2026111*` |

Invariants (also in `AGENTS.md`): private tables (`entries`, `private_config`) are only queried under
`src/app/admin` (`tests/privacy.test.ts`); no client component imports `@/lib/ai`, `ai-prompts` or `fetch-page`;
every admin action calls `requireAdmin()`; public queries go through `fetchOrThrow`.

## Checks before every commit
```bash
npm run lint && npm run typecheck && npm test && npm run build
```
Benchmark script used for the README numbers: run `next start` with `SUPABASE_SERVICE_ROLE_KEY=invalid`
(so local views don't hit the production counter), then time requests with curl.

## Gotchas hit this session
- The repo path contains a space (`/Documents/ development/`): quote paths; avoid unquoted `$(grep -l …)` lists.
- macOS: no `timeout` command; `grep -Z` means decompress (not NUL output); perl `s|…|…|` turns `\|` into alternation.
- Vitest only picks up `tests/**/*.test.ts`; JSX in tests works (oxc automatic runtime in `vitest.config.ts`).
- PostgREST `or()` values containing `:` `.` `,` must be double-quoted (see `src/app/admin/recap/page.tsx`).
