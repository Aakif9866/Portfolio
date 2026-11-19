# Maintenance: pending migrations and settings audit

## 0. One approval window for every pending migration

Four migrations are written, tested in PGlite, and **not applied**. They are applied together:

| File | What it does | App behaviour until applied |
| --- | --- | --- |
| `20261017000000_atomic_reorder_and_revisions.sql` | Atomic reorder and article revisions (§1) | Works, non-atomically |
| `20261118000000_increment_visit_count.sql` | Atomic page-view counter, callable by service_role only | Falls back to read-then-write |
| `20261119000000_media_storage_policies.sql` | Admin-only write/list policies on the `media` bucket; drops SVG, adds PDF/GIF | Uploads depend on whatever policies the bucket has today |
| `20261119000001_workspace_entries.sql` | Private workspace tables `entries` and `private_config` (admin-only RLS) | Inbox says the tables don't exist yet |

Steps (each needs your go-ahead):

1. `node --env-file=.env.local scripts/backup-db.mjs` (fresh snapshot).
2. Inspect the storage policies the media migration sits next to, and drop any that let
   non-admins write:
   ```sql
   select policyname, cmd, roles, qual, with_check
   from pg_policies where schemaname = 'storage' and tablename = 'objects';
   ```
3. `npx supabase login` and `npx supabase link --project-ref yajgzliiwwkvqvsfqtfs` (once).
4. `npx supabase db push --dry-run`, then review the output and give an explicit OK.
5. `npx supabase db push`.
6. Do the §1 app switch-over in the same deploy.
7. `node --env-file=.env.local scripts/check-rls.mjs`: anon must see 0 rows in `entries` and
   `private_config`, and can't list `media`.
8. In the admin: capture a link and a note, edit one, export JSON, then upload and delete a file.

Each file ends with its own `-- rollback` block.

---

## 1. Atomic reordering and article revisions — migration ready, not applied

**Problem.** Two admin operations are made of several separate requests:

| Operation | Today | Failure mode |
|---|---|---|
| Reorder (↑ ↓) | two `UPDATE`s from the app | if the second fails, two items share a position |
| Article save | insert a revision, then `UPDATE` the article | if the save fails, a revision exists for an edit that never happened |

**Fix.** [`supabase/migrations/20261017000000_atomic_reorder_and_revisions.sql`](../supabase/migrations/20261017000000_atomic_reorder_and_revisions.sql)

- `swap_positions(tbl, a, b)` — both rows change in one `UPDATE`, or neither does. Runs as the
  signed-in user (`SECURITY INVOKER`), so the existing RLS policies still decide what may change.
  Only signed-in users can call it; anonymous callers cannot. Allowlisted tables only.
- `articles_snapshot_revision` trigger — the previous title/body is saved in the same transaction
  as the edit. Same semantics as today (every content edit is recoverable; restore is itself an
  edit, so it is undoable), with one deliberate difference: a save that changes neither title nor
  body no longer stores a duplicate copy.
- Additive only: two functions, one trigger, grants. No table, column, row or RLS policy changes.

Tested against a real Postgres engine (PGlite) in `tests/migration-atomic.test.ts`: swap, tie
handling, refused tables, missing rows, all-or-nothing on mid-statement failure, execute grants,
revision on edit, none on publish/reorder, none when the edit fails, restore snapshots. The test
tables are stubs, so **RLS behaviour is only verifiable after applying** (step 4 below).

### Prerequisites

1. Supabase CLI login (opens a browser once): `npx supabase login`
2. Link this repo to the project (asks for the database password, stored as `SUPABASE_DB_PASSWORD` in `.env`):
   `npx supabase link --project-ref yajgzliiwwkvqvsfqtfs`
3. Explicit approval to change the production database.

No baseline migration is needed: `db push` applies only migrations missing from the remote
history, which is currently empty, so it applies just this file.

### Apply (only with approval)

```bash
npx supabase db push --dry-run   # shows exactly what would run
npx supabase db push
```

### Then switch the app over (same deploy, in this order)

The app is intentionally **unchanged** until the migration exists — calling functions that don't
exist would break reordering, and dropping the app-side snapshot early would lose revisions.

`src/app/admin/actions.ts`:

```ts
// reorder(): replace the two updates with one call. `a` must end up before `b`.
const [first, second] = dir < 0 ? [list[i], list[j]] : [list[j], list[i]];
const { error: swapErr } = await supabase.rpc("swap_positions", { tbl: table, a: first.id, b: second.id });
if (swapErr) return { ok: false, message: friendly(swapErr) };

// saveArticle(): delete the manual article_revisions insert — the trigger now does it.
export async function saveArticle(formData: FormData) { return saveRow(formData); }
```

### Verify on production

- Admin → Projects: move a project up and down; order changes, no duplicates.
- Admin → Articles: edit an article → one new revision; publish/unpublish → no new revision;
  restore a revision → content restored and a new revision appears.
- As a signed-out visitor, `rpc('swap_positions', …)` must fail (permission denied).

### Roll back

```sql
drop trigger if exists articles_snapshot_revision on public.articles;
drop function if exists public.snapshot_article_revision();
drop function if exists public.swap_positions(text, uuid, uuid);
```
…and revert the app change above in the same deploy.

---

## 2. `site_config` audit — 22 settings

**Origin.** All 22 rows were created on 2026-10-05 by a seed for an earlier design (site name
“AK Protocol”), matching the original brief's “Site config: edit, save, group” requirement.
`git grep` across **every commit** shows 20 of them were never read by any version of the app.
The other two (`social.*`) were connected in the last UX pass. `visit_count` is the counter's own
storage and is not part of this audit.

| Key | Current value (abridged) | Category | Recommendation |
|---|---|---|---|
| `social.github` | github.com/Aakif9866 | **In use** | Keep (nav, home, About, footer) |
| `social.linkedin` | linkedin.com/in/shaik-shuaib-aakif | **In use** | Keep |
| `about.principles` | 6 working principles | **Useful, implementable** | Add a “How I work” list to About — real content you wrote |
| `home.principles_title` | “Working principles” | Useful, implementable | Heading for the above; or drop and hard-code |
| `hero.lede` | “An engineering portfolio and the CMS that runs it…” | Needs clarification | Implementable as an editable hero paragraph, but it would replace the current live text |
| `hero.lines` | “Building software. / Exploring systems. / …” | Needs clarification | Alternative hero headline; conflicts with the current one |
| `about.interests` | AI, Systems, Web, … | Needs clarification | Could be tags on About; generic as written |
| `site.tagline` | “Software · systems · experiments · …” | Needs clarification | Could be the meta description / footer line |
| `footer.motto` | “Building systems · Breaking things · …” | Needs clarification | Could be the footer line; overlaps `site.tagline` |
| `site.name` | “AK Protocol” | Needs clarification | Conflicts with the site's identity (“Aakif”). Obsolete unless you want a brand name |
| `nav.items` | Work, System, Lab, Writing, About | **Obsolete / duplicate** | Navigation now lives in `src/lib/labels.ts` with clearer labels; this list also links to `/writing`, which doesn't exist |
| `hero.primary_cta` | “Explore work” → /projects | Duplicate | Hero buttons are hard-coded (“View projects”) |
| `hero.secondary_cta` | “Read writing” → /writing | **Obsolete** | Broken link (`/writing` doesn't exist) |
| `projects.title` | “Things worth building” | Duplicate | Same text as `home.work_title`; Projects page now titled “Projects” |
| `projects.description` | “Each one is a case study…” | Duplicate | Same text as `home.work_lede` |
| `home.work_title` | “Things worth building” | Obsolete | Creative heading replaced by descriptive “Selected case studies” |
| `home.work_lede` | “Each one is a case study…” | Implementable | Could become the home projects intro |
| `home.lab_title` | “Where unfinished things live” | Obsolete | Replaced by “Recent experiments” |
| `home.lab_lede` | “Experiments in progress, and the ones that did not…” | Implementable | Could become the home experiments intro |
| `home.system_title` | “Everything, and what it connects to” | Obsolete | Replaced by “Technologies I work with” |
| `home.system_lede` | “Built from the actual project records…” | Implementable | Could become the home tech intro |
| `home.writing_title` | “Notes from building things” | Obsolete | The home page has no articles section |

**Summary (22):** 2 in use · 2 useful and implementable · 3 intros implementable · 6 need your
decision · 9 obsolete or duplicate.

### Proposed cleanup (nothing below has been done)

1. **You decide** the “needs clarification” rows and which intros, if any, should be editable.
2. **Connect** the chosen keys: add each to `SITE_KEYS` in `src/lib/site-content.ts` (makes it
   editable in Admin → Settings) and read it where it's shown, with the current text as fallback.
   `tests/settings-usage.test.ts` fails if a page reads a key that isn't editable, or vice versa.
3. **Back up, then delete** the obsolete rows (only with approval — this changes production data):
   ```sql
   -- backup first
   select jsonb_agg(c) from site_config c where key in (
     'nav.items','hero.primary_cta','hero.secondary_cta','projects.title','projects.description',
     'home.work_title','home.lab_title','home.system_title','home.writing_title');
   -- then
   delete from site_config where key in ( …same list… );
   ```
   Until then they stay read-only under Admin → Settings → “Other stored settings”, where they
   can't affect anything.

---

## 3. Build-time database failures — fixed

Every public-page query goes through `fetchOrThrow` (`src/lib/db.ts`):

- A successful query with zero rows is returned as-is → genuine empty states still render.
- Timeouts (8 s per attempt) and network/connection errors are retried: 3 attempts, 0.4 s and
  1.2 s back-off — at most ~26 s per query. Real query errors are not retried.
- If it still fails, it throws `DataUnavailableError("Couldn't load … from the database.")`:
  - during `next build` → the build fails, Vercel keeps the previous deployment;
  - during the 5-minute ISR refresh → Next keeps serving the last good page;
  - on a first on-demand render → `app/error.tsx` (or `global-error.tsx` for the layout).
- Logs contain only `{ event, what, code, attempts }` — no URL, key or database message.
- The visit counter is the one non-essential read: on failure the footer omits the number and the
  dashboard says “Unavailable” rather than showing 0.

`tests/db-fetch.test.ts` also fails if any public page adds a query that bypasses `fetchOrThrow`.
Verified locally: a build pointed at an unreachable database fails in ~10 s with
“Couldn't load experiment list from the database.”; a normal build succeeds.
