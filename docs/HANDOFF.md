# Handoff — v2 development

**Read this first when the user says "continue".** Then pick up at **Next steps** below and
keep going without re-asking anything listed under **Decisions already made**. Update this
file (status table and next steps) at the end of every session.

Last updated: 2026-11-22 (session 6).

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
| Apply all 6 migrations + app switch-over (RPC reorder, trigger revisions, no visit fallback) | `4924bcf` | ✅ done, check-rls passed |
| v2-6 SECURITY.md, 4 ADRs, README screenshots | `ca045bb`, next | ✅ done |
| Separate v2 deployment (Vercel project `portfolio-v2`), GitHub section on home + About | this session | ✅ live |
| Shareable project card (`/projects/[slug]/card`) + share block + og image; docs/features.md | `d640ae2` | ✅ live |
| Recruiter view, GitHub stats, admin sidebar + Admin menu, v1 scroll reveal, Apple design pass, faster admin auth, sign-in card | `8fdda53`…`cec3fcc` | ✅ live (2026-11-19) |
| Six colour schemes picked on the dashboard (`theme.palette` in site_config); graphite favicon; calmer dashboard; project card v2 (1200×600, home-page view via hero image → Microlink screenshot → mock-up) | `4c7a554`…`9c12f79` | ✅ live (2026-11-19) |
| Session 6: empty Sort order no longer fails; hero image (landing page) shown on the case study; dev-only `unsafe-eval` in the CSP; header graphs on inner pages (`system-graph.tsx`, scheme-coloured); colour-scheme picker moved from the dashboard to a nav palette icon (per visitor, localStorage); **project share card removed entirely** (route, admin fields, og image) | `70f2099`…this commit | ✅ live (2026-11-22) |

**Nothing in the workspace

**Nothing in the workspace (`/admin` inbox, resources, logs, ideas, jobs, career, skills, resume) works on a
real database until the migrations are applied.** Pages show "the workspace tables don't exist yet" until then.

## Next steps (in order)

### Leftover from session 6
Migration `20261122000000_project_card` (applied 2026-11-22) added `projects.card_enabled`, `card_used_for`,
`card_features`. The card was then removed; the columns are unused. Drop them with a new migration only if the
user asks (production write, needs approval). Don't bring the share card back unasked.

### 0. Career OS scope (added 2026-11-19)
The user added a large scope: [career-os-spec.md](career-os-spec.md) (verbatim) with the audit and phased plan in
[career-os-roadmap.md](career-os-roadmap.md). Confidentiality comes first (Phase 0: visibility on entries,
confidential-terms list, server-side check on publish and AI). Build phase by phase; each phase's migrations need
explicit approval before they touch production.

### 1. Deployments
v2 is its own Vercel project, `portfolio-v2`: https://portfolio-v2-iota-ochre.vercel.app (`NEXT_PUBLIC_SITE_URL`
set there). v1 stays at https://portfolio-pi-weld-92.vercel.app (project `portfolio`, which this folder is still
linked to, and which a push to `main` deploys). Redeploy v2 from branch `v2` with:
`VERCEL_ORG_ID=team_5S8p37bdz33SKj2xanpfvQcl VERCEL_PROJECT_ID=prj_fWi1loEvat4oedWjx0ODiFxhnY7G npx -y vercel@latest deploy --prod --yes` (the CLI isn't on PATH; npx reuses the saved login).
Only when the user asks. The user keeps the existing data (don't wipe it). Optional: `GITHUB_TOKEN` (read-only)
in Vercel if the GitHub section ever drops out from rate limits; `DEEPSEEK_API_KEY` for AI help.

DB access for future checks: IPv4 pooler `aws-0-ap-south-1.pooler.supabase.com:5432`, user
`postgres.yajgzliiwwkvqvsfqtfs`, password `SUPABASE_DB_PASSWORD` in `.env` via `PGPASSWORD` (never echo it).
The direct host is IPv6-only. Writes still need explicit approval.

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

### UI ideas offered to the user (pending their pick, 2026-11-19)
Project screenshots on cards (field exists), case-study summary box, "Latest video" strip from the YouTube channel
feed, active-section highlight in the article TOC, View Transitions crossfade, 44px tap targets on chips.

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
