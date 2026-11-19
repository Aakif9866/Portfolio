# Private Workspace — scope and phases

## Context
v2 Phases 1–2 are done on branch `v2`: favicon and declutter (`0bc0c9f`), speed (`6ffb86d`).

You now want the portfolio to also be a **private career workspace**:
- saving resources;
- engineering logs;
- ideas;
- career goals;
- a job tracker;
- an AI resume builder.

The workspace must stay **lightweight**: capture in seconds, organise later, nothing mandatory.

The public site must never expose any of it.

**Decided by you:**
- **Scope:** the portfolio holds career things; PLOS keeps daily life, to-dos and habits. No duplicated features; the workspace links to PLOS.
- **AI:** DeepSeek is the default. It is called through the OpenAI-compatible API, so Groq or Gemini are config changes, not rewrites.
- **Out of scope:**
  - capturing from the phone's share sheet;
  - Gmail;
  - LinkedIn and Instagram integrations.
    They have no official API for this; saving a link is done by pasting it.

**`rea`** ([morluto/rea](https://github.com/morluto/rea), MIT) is an MCP and CLI tool for reverse engineering. It is used **while building**, never at runtime:
- I can call it to study how Notion, Readwise, Teal or Linear handle a specific interaction before building our version;
- ideas only, never copied code or assets.

## Shape: one inbox, a few views
Avoid ten modules with ten forms. There is **one private `entries` table** that every view reads. Each entry needs only a title or a URL; everything else is optional.

```
entries
  id uuid pk, kind text, title text, body_md text, url text,
  tags text[] default '{}', status text null, pinned bool default false,
  due_on date null, meta jsonb default '{}',
  created_at, updated_at,
  search tsvector (generated from title, body_md, url, tags)
kind ∈ note | link | log | idea | goal | job          (changeable at any time)

entry_links (a uuid, b uuid)                     -- optional links: resource↔goal, job↔resume
private_config (key text pk, value jsonb)        -- career profile, resume master profile
resumes (id, title, job_id null, content jsonb, created_at, updated_at)
```

- **`meta` holds the details for each kind, all optional:**
  - link: `site`, `image`, `summary`;
  - job: `company`, `role`, `applied_on`, `next_follow_up`, `resume_id`;
  - log: `area`.
- **Status words** for each kind live in `src/lib/labels.ts`, like the existing vocabulary:
  - link: to read / reading / done;
  - idea: someday / next / active / dropped;
  - goal: open / achieved / dropped;
  - job: saved / applied / interviewing / offer / rejected / closed.
- **Uncategorised is the default.** Tags are free text and nothing is required.

## Privacy (non-negotiable, three layers like the admin)
1. **URLs:** everything lives under `/admin/*`. Middleware redirects signed-out visitors, and the pages are already `noindex`.
2. **`requireAdmin()`** (`src/lib/auth.ts`) runs in every workspace page and Server Action.
3. **RLS on every private table:**
   - one policy, `for all to authenticated`, that uses the same allowlist rule as the existing tables (`admin_allowlist` is keyed by `email`);
   - before writing it, check the real policy text with the Supabase MCP;
   - **no anon policy at all**, so anon reads return 0 rows.

**Guards:**
- A new test fails if any public page (outside `src/app/admin`) mentions `entries`, `private_config` or `resumes`. This follows the file walk in `tests/db-fetch.test.ts`.
- `scripts/check-rls.mjs` asserts that anon sees 0 rows in each private table.

**AI keys and data:**
- `DEEPSEEK_API_KEY` stays server-side in env, never `NEXT_PUBLIC_` and never stored in the DB.
- Salary and career-profile fields are never put in AI prompts unless you press a button that says so.
- Note: DeepSeek processes data on its own servers. The plan keeps what is sent minimal.

## Phases
Each phase is usable on its own. Stop after any phase and the workspace still works.

### Finish v2 first (already planned)
- **v2-3, Supabase Storage:** the `media` bucket, the upload action and a Media page.
  - The resume builder (PDF assets) and workspace notes (images) reuse it.
- **v2-4, Markdown editor and reader:** the Write / Preview / Split editor is built once and reused by every workspace entry.
- **v2-5 and v2-6:** removals and quality gates, as planned.

### W0 — Inbox and quick capture (core; the 30-second use)
- **Workspace home** at `/admin`. The current dashboard moves to `/admin/site`.
  - The admin sidebar gets two groups: **Workspace** (Inbox, Resources, Logs, Ideas, Career, Jobs, Resume) and **Site** (the existing CMS pages).
- **Quick capture bar:** always visible at the top of every workspace page, with ⌘J to focus it. One box:
  - pasting a URL makes a `link`; a Server Action fetches the page title, site name and OG image, with a 5 s timeout, and if that fails it just keeps the URL;
  - anything else makes a `note`;
  - optional `#tags` are parsed from the text.
- **Inbox:** everything, newest first.
  - Full-text search uses the Postgres `search` column with a `websearch_to_tsquery` filter, plus kind and tag chips.
  - Clicking an entry opens a side drawer: change its kind, add a status, tags or due date, edit the body with the v2-4 editor, or link it to another entry.
- **Export:** "Download everything", as JSON (restorable) or a Markdown zip (one `.md` file per entry, readable anywhere). `scripts/backup-db.mjs` already picks up the new tables.
- **Migration:**
  - `entries`, `entry_links`, `private_config` and `resumes`, with RLS, indexes (GIN on `search` and `tags`) and an `updated_at` trigger;
  - a rollback block;
  - PGlite tests.

### W1 — Views over the inbox (resources, logs, ideas)
These are the same rows filtered differently; no new tables.
- **Resources** (`kind=link`):
  - a source icon (YouTube, GitHub, docs, blog, LinkedIn, …) detected from the URL;
  - status chips; favourite (`pinned`);
  - a "Recently saved" list and a "Learning queue" (status "to read", ordered).
- **Logs** (`kind=log`):
  - a timeline grouped by week; optional `area` (backend, system design, AI/ML, frontend, DevOps, research);
  - a one-line log is fine;
  - "Promote to case study" pre-fills a draft public project section. It stays a draft until you publish it.
- **Ideas** (`kind=idea`):
  - a 4-column board: someday → next → active → dropped;
  - "Start project" creates a draft public project, which stays private until published.
- **Workspace home cards:**
  - recent captures; active goals; jobs needing a follow-up; this week's logs;
  - a link to PLOS for daily to-dos.
- **Weekly recap,** no AI: what was logged, saved and achieved in the last 7 days. It is generated when opened, never sent anywhere.

### W2 — Career (strictly private)
- **Career profile** (`private_config.career`): current and target salary, target roles, companies of interest, short- and long-term goals as free text.
  - Shown only on `/admin/career`, never in any public query.
- **Goals** (`kind=goal`):
  - deadline optional; milestones are a Markdown checklist in the body, so no milestone table;
  - link resources, logs and skills to a goal.
- **Skills:**
  - reuse the public `technologies` table (59 rows), which is already the public skill list;
  - add a private proficiency or "want to learn" note per technology in `private_config.skills`, so the public site is unchanged.
- **Career dashboard:** progress counted from goals (achieved vs open), skills marked "want to learn" that have linked resources, and recent logs per area. Plain counts, no scores.

### W3 — Job tracker
- `kind=job`, with a list view and a board view by status.
- **Fields:** company, role, link, pasted JD (body), status, applied date, next follow-up date, notes.
- **Follow-ups:** a "Follow-ups due" card on the workspace home. **No notifications.**
- **Linking:** link a resume version (`meta.resume_id`) and recruiter notes (linked `note` entries).

### W4 — AI layer (DeepSeek)
- **`src/lib/ai.ts`:** one `chat(messages)` helper.
  - It is a plain `fetch` to an OpenAI-compatible `/chat/completions` endpoint (`AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`), so there's no SDK.
  - It is server-only; `requireAdmin()` runs before each call; there is a timeout and a clear error message.
  - Switching to Groq or Gemini changes only the three env values.
- **Buttons, never automatic:**
  - **Summarise** a link: fetch the page text on the server, then save the summary into `meta.summary`.
  - **Structure this log:** rough note → what I built / the problem / the fix / tech / what I learned, plus suggested resume bullets. Accept or discard.
  - **Improve writing** for any entry body.
  - **Draft an email** to a recruiter or for a follow-up, from a job entry.
- **Cost guard:** show the token count after each call. A monthly soft cap in env makes calls refuse once it is reached; usage is logged in `private_config.ai_usage`.

### W5 — Resume builder
- **Master profile** (`private_config.resume_master`), entered once:
  - contact details, education, experience and skills;
  - pre-filled from the public projects, `technologies` and `timeline_entries`, plus bullets accepted from W4.
- **Versions** (`resumes`):
  - duplicate the master, then edit it; you can keep as many as you like;
  - link a version to a job.
- **Tailor to a job description:** the AI reorders and rewrites bullets to match the job description and suggests missing keywords. It shows a diff to accept; it never invents facts.
- **Layout:**
  - a clean, one-column HTML/CSS version of the Jake's Resume style (it's public under the MIT license), served at `/admin/resume/[id]/print`;
  - **export to PDF** with the browser's own Print → Save as PDF (`@page` CSS). The PDF keeps real, selectable text, so applicant-tracking systems can read it. No LaTeX server and no new library.
  - an optional **`.tex` export** of the same content for Overleaf, built from a string template.

### W6 — Only if you ask for it later
| Idea | Why it's deferred |
| --- | --- |
| AI semantic search (pgvector embeddings) | Postgres full-text search covers most of it; add this if search ever feels weak |
| Knowledge graph view | Linked entries plus tags show the same connections; a graph is mostly decoration |
| Reminders and notifications | You asked for none by default; the follow-up card covers jobs |
| Excalidraw | Storage covers diagrams as images; embedding it adds about 1 MB of JS |
| To-dos and habits | These live in PLOS |

## Cost
| Item | Cost |
| --- | --- |
| Supabase free tier (500 MB DB, 1 GB storage) | Free; text entries are tiny |
| Vercel Hobby | Free |
| DeepSeek | Pay per use. Light personal use (summaries, log structuring, a few resume tailorings a month) should cost well under $1 a month. Check current rates on the DeepSeek pricing page before topping up |
| Groq / Gemini (fallback) | Free tiers, changed through env only |
| Everything else (FTS, PDF via print, export) | Free; no new paid service and no new npm dependency planned |

## Reuse
| Need | Reuse |
| --- | --- |
| Admin checks | `requireAdmin` (`src/lib/auth.ts`) |
| Server-side Supabase client | `supabaseServer()` (`src/lib/supabase/server.ts`) |
| Form fields and server allowlist | `FIELDS`, `saveRow` pattern (`src/lib/admin-fields.ts`, `src/app/admin/actions.ts`) |
| Status vocabulary | `labels.ts` |
| Admin UI pieces | `AdminHeader`, `RowActions`, `StateChip` (`src/app/admin/ui.tsx`) |
| Markdown | `Markdown` component (`src/components/markdown.tsx`), plus the v2-4 editor |
| Storage | v2-3 `uploadMedia` |
| Sidebar and modal patterns | PLOS shell and modal patterns (`_refs/plos/src/components/shell.tsx`, `ui.tsx`) |
| Backups | `scripts/backup-db.mjs` |

## Verification
- Every phase: `npm run lint && npm run typecheck && npm test && npm run build`.
- Migrations: PGlite tests (pattern `tests/migration-*.test.ts`):
  - RLS logic, using stub roles: anon reads 0 rows and can't write;
  - the generated `search` column;
  - `updated_at` trigger behaviour.
- The privacy guard test plus `check-rls.mjs` after the DB changes are applied.
- Manual:
  - paste a URL, then a note with `#tag` → both appear in the Inbox; search finds both;
  - change kind to idea and move it on the board;
  - add a job with a follow-up date → the home card shows it;
  - build a resume version → print to PDF → check the text is selectable;
  - signed out, `/admin/*` redirects, and the anon client returns 0 rows for every private table.
- All DB changes go in the single approval window: snapshot → `db push --dry-run` → your OK → apply.

## Suggested order
v2-3 → v2-4 → **W0** → W1 → W3 → W2 → W4 → W5 (v2-5 and v2-6 alongside).

W0 and W1 alone give daily value: capture, resources, logs and ideas. The job tracker (W3) comes before Career (W2) because it is the most immediately useful during a job search. AI (W4) comes before the resume builder (W5), because tailoring needs it.
