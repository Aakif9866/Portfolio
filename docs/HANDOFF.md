# Handoff — v2 development

**Read this first when the user says "continue".** Then pick up at **Next steps** below and
keep going without re-asking anything listed under **Decisions already made**. Update this
file (status table and next steps) at the end of every session.

Last updated: 2026-11-19 (session 3).

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
| v2-6 CI workflow + Playwright visitor smoke tests | `26e0dda`, `4d2c005` | ✅ done · ⏳ repo secrets |
| **Apply pending migrations (5)** | — | ⏳ **blocked on the user** |
| v2-6 SECURITY.md, 4 ADRs, README screenshots | `ca045bb`, next | ✅ done |

**Nothing in the workspace (`/admin` inbox, resources, logs, ideas, jobs, career, skills, resume) works on a
real database until the migrations are applied.** Pages show "the workspace tables don't exist yet" until then.

## Next steps (in order)

### 1. Apply the 5 pending migrations — needs the user
Runbook: [`docs/maintenance.md` §0](maintenance.md). Files in `supabase/migrations/`:
`20261017000000_atomic_reorder_and_revisions.sql`, `20261118000000_increment_visit_count.sql`,
`20261119000000_media_storage_policies.sql`, `20261119000001_workspace_entries.sql`,
`20261119000002_remove_obsolete_site_config.sql` (data delete; rollback insert in the file).
The visit migration was fixed on 2026-11-19: it assumed `site_config.value` was text, but it's jsonb.

Ask the user to do the interactive parts. Never write to production without their explicit OK in that message.
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
- Repo secrets for CI: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (user sets them; CI only runs once pushed).
- Admin Playwright journeys need a test account — ask the user before adding any.
- Screenshots (`docs/screenshots/`) were taken from a local `next start` against the live DB; retake after visual changes.
- Possible next work (ask first): fix the link-preview redirect SSRF gap (SECURITY.md "Known limits"); a baseline
  migration capturing the dashboard-created schema so a fresh DB can be built; the empty grey cell in the
  project page facts row when only 2 facts exist.

### Small follow-ups noticed
- Vercel env: set `NEXT_PUBLIC_SITE_URL=https://portfolio-pi-weld-92.vercel.app` (local `.env.local` has
  `localhost:3000`, so feed links would point there). Add `DEEPSEEK_API_KEY` to enable AI (W4/W5).
- Compile one exported `.tex` resume on Overleaf; fix the preamble if needed (`src/lib/resume.ts`).
- Not built (deferred on purpose): log → "promote to case study"; W6 ideas (semantic search, knowledge graph,
  reminders, Excalidraw).

## Decisions already made (don't re-ask)

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
