# Deploying, settings, secrets and migrations

How this site gets from this laptop to the internet, where its settings and secrets live, and how
database changes (migrations) are made. Written in plain language; the exact commands are included
so it can be followed step by step.

## The pieces

| Piece | What it is | Where it runs |
| --- | --- | --- |
| **The app** (pages + admin + server code) | One Next.js project. Pages, the admin's save actions, the share-card images and the login check all live in the same codebase | Vercel |
| **The database** | Postgres on Supabase: projects, articles, settings, the private workspace, uploaded files | Supabase (separate from Vercel) |
| **The code history** | Git, pushed to GitHub (`main` = v1, `v2` = the new version, tag `v1` marks the old one) | GitHub |

Because the front end and back end are one Next.js app, there is **one thing to deploy**. The
database is never touched by a deploy.

## Two live sites

| | Address | Vercel project | Updated by |
| --- | --- | --- | --- |
| **v1** | https://portfolio-pi-weld-92.vercel.app | `portfolio` | a push to the `main` branch |
| **v2** | https://portfolio-v2-iota-ochre.vercel.app | `portfolio-v2` | the command below, run from branch `v2` |

Both read the same Supabase database, so content edited in either admin shows on both.

## Deploying v2 in one go

```sh
git checkout v2
npm run lint && npm run typecheck && npm test        # checks first
VERCEL_ORG_ID=team_5S8p37bdz33SKj2xanpfvQcl \
VERCEL_PROJECT_ID=prj_fWi1loEvat4oedWjx0ODiFxhnY7G \
npx -y vercel@latest deploy --prod --yes
git push origin v2                                    # keep GitHub in step with what's live
```

What happens:

1. **Login is already saved.** `vercel login` was done once; the CLI keeps that login on this Mac,
   so later commands run as the account without asking.
2. **Upload.** The project folder is uploaded, except what `.vercelignore` lists: `.env` files,
   backups, `node_modules`, build output, test reports.
3. **Build on Vercel.** Vercel installs packages and runs `next build` with the project's own
   environment variables (see below), then switches the address to the new version (~1 minute).
4. **Why the two IDs:** this folder is linked to the v1 project (`.vercel/project.json`). The two
   `VERCEL_…_ID` values point this one command at `portfolio-v2` instead, so v1 is never touched.

If something goes wrong, the previous version keeps serving; a failed build never replaces it.
Any earlier deployment can be promoted back from the Vercel dashboard.

## Settings and secrets

| Name | What it's for | Secret? | Where it's set |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | The database's address | No (goes to browsers) | `.env.local`, Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key: can only read published content, because the database's security rules (RLS) say so | No (goes to browsers) | `.env.local`, Vercel |
| `NEXT_PUBLIC_SITE_URL` | The site's own address, for share links, the sitemap and RSS | No | Vercel (per project) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key, used only to add 1 to the visit counter | **Yes** | `.env.local`, Vercel (marked sensitive) |
| `DEEPSEEK_API_KEY` | Optional: turns on the admin's AI help | **Yes** | `.env.local`, Vercel |
| `GITHUB_TOKEN` | Optional, read-only: raises GitHub's rate limit for the GitHub section | **Yes** | Vercel only if ever needed |
| `SUPABASE_DB_PASSWORD` | The database owner's password, **only** for migrations | **Yes** | `.env` on this Mac only, never on Vercel |

Rules that keep secrets safe:

- **Only `NEXT_PUBLIC_…` names reach browsers.** Anything without that prefix stays on the server.
- **`.env` and `.env.local` are ignored by Git** and excluded by `.vercelignore`, so they are never
  committed, pushed or uploaded.
- **Live values are stored in Vercel**, added with `npx vercel env add NAME production` (the value
  is typed or piped in, never written into code) and viewed in the Vercel dashboard.
- **Secrets are never printed.** When a command needs the database password it is read straight
  from the file into the command, e.g. `PGPASSWORD="$(grep '^SUPABASE_DB_PASSWORD=' .env | cut -d= -f2-)"`,
  so it never appears on screen or in logs.
- **GitHub holds no secrets**; its automated checks use only the public URL and key.
- The full threat model is in [SECURITY.md](../SECURITY.md).

## Migrations: how the database structure changes

A **migration** is a small SQL file in `supabase/migrations/` that changes the database's
*structure* (a new column, table, function or security rule), named with a timestamp so they run
in order. Supabase records each one it has applied in `supabase_migrations.schema_migrations`, so
none ever runs twice.

### Were migrations done? Yes: six, all applied on 2026-11-19

Confirmed from the database's own record (read-only check):

| File | What it changed |
| --- | --- |
| `20261017000000_atomic_reorder_and_revisions` | `swap_positions()`: reordering items in one atomic step; a trigger that saves an article's previous version on every save |
| `20261118000000_increment_visit_count` | `increment_visit_count()`: the visit counter adds 1 in one atomic step, callable only by the server |
| `20261119000000_media_storage_policies` | Security rules for uploaded files: anyone can view, only the admin can upload, list or delete |
| `20261119000001_workspace_entries` | The private workspace tables (`entries`, `private_config`), visible to the admin only |
| `20261119000002_remove_obsolete_site_config` | Removed 9 old, unused settings rows (the file includes how to restore them) |
| `20261119000003_article_media` | Blog columns: `tags`, `cover_image_url`, `video_url` |

### How they were applied

1. **Written and tested locally first.** Each migration has a test that runs it against an
   in-memory Postgres (PGlite), e.g. `tests/migration-visits.test.ts`, so a broken migration fails
   in `npm test` before it ever reaches the real database.
2. **Backup.** A read-only snapshot of every table:
   `node --env-file=.env.local scripts/backup-db.mjs` → `backups/<timestamp>/` (gitignored).
3. **Dry run.** Shows which migrations would run, without running them:
   ```sh
   PGPASSWORD="$(grep '^SUPABASE_DB_PASSWORD=' .env | cut -d= -f2-)" \
   npx -y supabase@latest db push --dry-run \
     --db-url "postgresql://postgres.yajgzliiwwkvqvsfqtfs@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
   ```
4. **Apply** (same command without `--dry-run`), after explicit approval.
5. **Verify.** Check the migration record, and run the security check that proves visitors still
   see only published content: `node --env-file=.env.local scripts/check-rls.mjs`.

**Why the database password was needed:** the app's keys can only read and write *rows*, and only
where the security rules allow. Changing the *structure* needs the database owner's login, which is
this password. The site itself never uses it. The connection goes through Supabase's IPv4 "pooler"
address because the direct database address is IPv6-only and unreachable from this network.

### What did not need a migration

- **The colour schemes** are stored as one settings row (`theme.palette`) in the existing
  `site_config` table. The first time a scheme is picked on the dashboard, that row is created.
- **The LinkedIn link fix** was a change to one existing row's *value*, not to the structure.
- **The recruiter page, project cards and GitHub section** only read existing data.

### Rules

- Never edit a migration that has already been applied; add a new one instead.
- Writes to the production database (migrations or data) need explicit approval each time.
- Known gap: the original tables were created in the Supabase dashboard, so the repo can't rebuild
  a fresh database from scratch yet. A "baseline" migration capturing them is the fix (see
  [maintenance.md](maintenance.md)).
