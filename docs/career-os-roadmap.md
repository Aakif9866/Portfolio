# Career OS — audit and roadmap

Scope: [career-os-spec.md](career-os-spec.md) (the user's requirements, verbatim, added 2026-11-19).
This file maps that scope onto what exists, records the design choices, and orders the work.
Nothing here is built yet. Update the status column as phases land.

## Guiding choices

These follow from the spec's principles and how the code already works:

1. **Extend what exists; don't add parallel systems.** The private workspace is one `entries` table
   with a `kind`, `tags`, `status` and a `meta` jsonb. New private record types (achievement,
   learning topic, question, reflection, snippet) become new `kind`s, not new tables. Public content
   keeps its own tables with `state` (draft/published/archived), because RLS for anon depends on it.
2. **Public tables only receive rows the admin saves on purpose.** Nothing ever copies from
   `entries` to a public table automatically. That rule already exists in `tests/privacy.test.ts`
   and stays the backbone of the confidentiality work.
3. **No new nav items.** Recruiter view, credibility and timeline live on existing pages or
   off-nav URLs (linked from Home/About). The 6 public nav items stay.
4. **Postgres before services.** Search is Postgres full-text, the graph is derived from tags and
   links, and analytics are daily counters. No vector database, no third-party trackers.
5. **AI stays optional and reviewed.** Every AI output is a preview the admin accepts or discards;
   nothing is saved or published by AI.

## Audit: what exists, what's partial, what's missing

✅ exists · 🟡 partial · ❌ missing

### 1. Confidentiality (priority over everything)

| Requirement | State | Notes |
| --- | --- | --- |
| Private workspace never reaches public pages | ✅ | RLS (admin-only on `entries`, `private_config`) + `tests/privacy.test.ts` |
| No automatic private → public conversion | ✅ | No such code path exists; keep it that way (test it) |
| Mark records confidential / private / publishable | ❌ | Add a `visibility` column on `entries` (default `private`) |
| Extra confirmation before publishing work-derived content | ❌ | A "derived from professional work" flag on public rows, plus a confirm step in the publish transition |
| Keep confidential names out of public content and AI | ❌ | A private **confidential-terms list** (employer, clients, code names) in `private_config`; publish and AI calls are blocked when text contains a term |
| AI never sees confidential records | 🟡 | Prompts already use only the entry the button was pressed on and never the career profile/salary. Add: refuse `visibility = 'confidential'` and term matches |
| Help describe transferable experience generically | ❌ | An AI "make it generic" action that strips names; output still goes through the terms check |

### 2. Public portfolio

| Requirement | State | Notes |
| --- | --- | --- |
| Professional identity (focus, availability, interests…) | 🟡 | About text exists in `site_config`. Add 7 optional keys to the Settings form; render only the ones filled in |
| Career timeline (education, work) | 🟡 | `/experience` from `timeline_entries` (work, education). Add `internship`; show certifications/awards/milestones from the credentials table on the same timeline by date |
| Link timeline entries to projects, skills | 🟡 | `timeline_technologies` exists but is empty and unused. Add `timeline_projects` |
| Case-study sections | 🟡 | 17 section kinds already cover problem, approach (how), architecture, decisions/trade-offs, challenges, testing, performance, infrastructure, future, lessons. Missing: **limitations** (and ML kinds, see 7). Sections are already optional |
| Impact indicators | ❌ | `project_metrics` (label, value, unit, optional before/after, note). The empty `claims` table may fit; inspect it before choosing |
| Screenshots, diagrams, charts | 🟡 | Diagrams ✅, hero image ✅, images in Markdown ✅. Add a screenshot gallery per project; charts from metrics (simple bars, no chart library) |
| Certifications, awards, testimonials, open source, talks, publications | ❌ | One `credentials` table with `kind` and `state`, not seven tables. Testimonials need the person's consent noted (a checkbox) |
| Recruiter mode | ❌ | `/recruiter` (off-nav, linked from Home/About), one screen: intro, current role, core skills, 3 featured projects, top achievements, education and certifications, resume PDF, contact, GitHub, LinkedIn |
| Resume download (public) | ❌ | Resumes are private (`private_config`). Add "publish this version as the public resume": a separate copy that goes through the terms check, served as a print page / PDF |
| Role-specific resume versions | ✅ | `resume.v.<id>` versions, optionally tied to a job |
| Profiles (Backend, SWE, AI Engineer…) | 🟡 | Versions exist; add starter templates per role |
| Achievement-based bullets | 🟡 | Accepted bullets from logs are offered; extend to achievements (Phase 2) |
| JD tailoring, PDF, LaTeX | ✅ | Tailor to the job (AI), Print PDF, `.tex` |
| Resume version history | ❌ | Same approach as article revisions (a revision on each save) |

### 3. Private career workspace

| Requirement | State | Notes |
| --- | --- | --- |
| Unified activity timeline | 🟡 | Logs timeline + weekly recap exist. Make it one read-only view over entries, milestones, published articles and credentials. No new data entry |
| Achievement builder | ❌ | `kind = 'achievement'`: raw note → structured (situation, action, impact, metrics) → bullet; `meta` holds skills, project id, resume-worthy flag; versions via revision history |
| Skills intelligence | 🟡 | Skills page has private levels and want-to-learn. Add confidence, evidence links, related skills; **derive** last used and projects from project technologies and log tags, not typed by hand; monthly snapshot for history. Labelled "self-assessed" |
| Learning management | 🟡 | Resources + learning queue exist. Add `kind = 'topic'` with `meta.parent_id` (paths → topics → subtopics), progress as an optional status, `kind = 'question'`; resources attach to topics by tag |
| Career planning | 🟡 | Profile (salary, target roles/companies, plans) and goals with milestones exist. Add required skills per target role, interview prep notes, monthly reflections (`kind = 'reflection'`), salary history |
| Readiness analysis | ❌ | Compare skills against a job description; first version without AI (keyword match), AI explanation optional |

### 4. AI assistants

| Requirement | State | Notes |
| --- | --- | --- |
| Optional, key config, usage cap | ✅ | DeepSeek by default, monthly token cap |
| Writing, summarise, structure, tailor | ✅ | Existing buttons |
| Specialised assistants | ❌ | Prompt presets on the same `ai.ts` client, not separate systems |
| Ask my professional history | ❌ | Postgres full-text search retrieves records → AI answers citing record links; answers split into "From your records" and "Suggestions". Confidential records excluded unless the question is explicitly private-only |
| Cost awareness | 🟡 | Cap exists; show estimated cost per call |

### 5. Analytics

| Requirement | State | Notes |
| --- | --- | --- |
| Visit counter | ✅ | Atomic RPC |
| Top projects/articles, referrers, devices | ❌ | A daily counter table `page_stats(day, path, referrer_host, device)`: no IP, no cookies, no user agent stored, from middleware's existing `waitUntil`. (Vercel Web Analytics is the zero-code alternative) |
| Resume downloads, contact clicks, card shares | ❌ | Same table, `path` = event name |
| Private analytics | ❌ | Queries over existing data on the dashboard; no tracking needed |

### 6. Knowledge management

| Requirement | State | Notes |
| --- | --- | --- |
| Reusable tags | 🟡 | `tags text[]` on entries and articles. The empty `tags`/`project_tags` tables are unused; decide: adopt or drop |
| Search private content | 🟡 | Inbox search exists; make it Postgres full-text across all private kinds |
| Backlinks / related | ❌ | `[[title]]` links in Markdown, resolved on save into a `links` table (from, to); "Linked from" on each record |
| Bookmarks / favourites | ✅ | `pinned` on entries |
| Attachments | 🟡 | Media uploads exist; attach to any record through `meta.attachments` |
| Version history | 🟡 | Articles only; generalise to entries and resumes |
| Archive and recovery | 🟡 | Status/state exist; add a "Recently archived" list |
| Full export (JSON/Markdown) | 🟡 | Entries export exists; extend to everything |
| Knowledge graph | ❌ | Optional admin page, nodes from projects/tech/tags/links, click opens the record; reuse the diagram SVG approach |

### 7. Developer-focused

| Requirement | State | Notes |
| --- | --- | --- |
| ADRs, system design, API docs, testing, deployment | 🟡 | Covered by section kinds (decisions, architecture, api, testing, infrastructure). Add `deployment` if distinct from infrastructure |
| Interactive diagrams | ✅ | |
| Snippets | ❌ | `kind = 'snippet'` in entries |
| Changelog | 🟡 | Project milestones serve as the changelog |
| Model cards (dataset, model, metrics, limitations) | ❌ | Section kinds `dataset`, `model`, `evaluation`, `limitations`, shown only when filled |

### 8. Usability

| Requirement | State | Notes |
| --- | --- | --- |
| Command palette | 🟡 | Public ⌘K exists; add admin actions (new project, new log…) |
| Quick capture | ✅ | ⌘J on every admin page |
| Shortcut reference | ❌ | `?` overlay |
| Recently viewed | ❌ | localStorage, per device |
| Autosave | 🟡 | Unsaved-changes warning exists; add local draft autosave |
| Duplicate, templates | ❌ | Duplicate project/article as draft; section templates |
| Bulk archive/edit | ❌ | Checkbox select on admin lists |
| Ordering | 🟡 | Up/down reorder (atomic) exists; drag-and-drop optional |
| Calendar view | ❌ | Month grid of due dates/logs |
| Markdown import/export | 🟡 | Export exists; add import |
| Mobile capture, PWA, offline notes | ❌ | Web app manifest + share target for capture; offline only for pinned notes |
| Reminders | ⚠️ | **Conflicts with an earlier decision** (follow-ups show in the app, never as notifications). Keep in-app only unless the user changes that |
| Customisable dashboard | ❌ | Lowest value; show/hide widgets only |

## Database changes (each a migration; production writes need explicit approval)

| Phase | Change |
| --- | --- |
| 0 | `entries.visibility text not null default 'private' check (in ('private','confidential','publishable'))`; `work_derived boolean default false` on projects, articles, credentials; confidential terms stored in `private_config` (admin-only) |
| 1 | `credentials` (kind, title, issuer, date, url, verify_url, quote, author, consent, state, position) with anon read of published; `project_metrics`; `project_screenshots` (or `meta`); new section kinds `limitations`, `deployment`, `dataset`, `model`, `evaluation`; `timeline_entries.kind` + `internship`; `timeline_projects`; resume revisions |
| 2 | New `entries.kind` values: `achievement`, `topic`, `question`, `reflection`, `snippet`; `skill_snapshots` (monthly, private) |
| 3 | `links` (from_type, from_id, to_type, to_id); `entries` full-text index; generic `revisions` for entries |
| 4 | `page_stats` (day, path, referrer_host, device, count) with an increment RPC for `service_role` only, like `increment_visit_count` |

Before Phase 1: inspect the empty `claims`, `claim_sources`, `sources`, `portfolio`, `tags`,
`project_tags` tables (read-only) and either reuse or drop them, so there aren't two of everything.
Also commit a **baseline schema migration**, which is still missing.

## Security and access-control implications

- Every new public table: RLS with anon `select` on `state = 'published'` only, admin write through
  `is_admin()`; added to `scripts/check-rls.mjs` and the PGlite migration tests.
- Every new private kind/table: admin-only RLS, listed in `tests/privacy.test.ts` as never queried
  outside `src/app/admin`.
- The terms check runs on the **server** in the publish transition (`src/lib/form.ts`) and before every
  AI call (`src/lib/ai.ts`), so the UI can't skip it. Unit-tested.
- Public resume: a separate published copy, never a live view of a private version.
- Testimonials: store only name, role and quote the person agreed to; no emails.
- Analytics: no IP, cookie or full user agent stored; referrer reduced to host; device = mobile/desktop/tablet.
- Ask-my-history: retrieval only through the admin's own session (RLS applies); outputs not cached.

## Roadmap

Each phase lands as small commits with tests, mobile check at 320px, the privacy and RLS checks,
and README/features updates. Deploy to v2 only when the user asks.

| Phase | Contents | Status |
| --- | --- | --- |
| **0 — Confidentiality foundation** (first, because the spec puts it above everything) | `visibility` on entries; confidential-terms list in Settings; server-side terms check on publish and AI; "derived from work" flag + confirm on publish; AI refuses confidential records; tests | ⏳ |
| **1 — Professional portfolio** | Professional identity keys; `credentials` (certifications, awards, testimonials, open source, talks, publications) with admin forms and a public section; timeline additions + links; `limitations` + metrics + screenshots in case studies; `/recruiter`; public resume copy; resume templates + version history | ⏳ |
| **2 — Career intelligence** | Achievement builder; unified activity timeline; skills intelligence (derived last-used, evidence, history); learning paths/topics/questions; career planning additions; readiness analysis (no AI first) | ⏳ |
| **3 — Knowledge management** | `[[links]]` + backlinks; related records; full-text search; generic version history; attachments; full export; optional knowledge graph; snippets; model-card section kinds | ⏳ |
| **4 — AI and analytics** | Assistant presets (documentation, achievements, interview coach, skill gap, learning, weekly analyst, writing); Ask my history with citations; cost display; private analytics; privacy-first public stats | ⏳ |
| **5 — Quality of life** | Admin palette actions, `?` shortcuts, recent items, autosave, duplicate/templates, bulk archive, calendar, Markdown import, PWA + share-target capture, offline pinned notes, dashboard widget toggles | ⏳ |

## Suggested cuts (to keep it maintainable)

- Drag-and-drop ordering: the atomic up/down already works.
- Customisable dashboard beyond show/hide.
- Offline for anything except pinned notes.
- Separate tables per credential type, per assistant, per learning item: one table or one `kind` each.
