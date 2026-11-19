# Security

The threat model for this site: what is protected, from whom, where the boundaries are, and
the check that proves each one. The layered admin check and the three Supabase clients are
described in the [README](README.md#security). This file doesn't repeat that.

## What is protected

| Asset | Where it lives | Who may read | Who may write |
| --- | --- | --- | --- |
| Published content (projects, articles, experiments, timeline) | Postgres, `state = 'published'` | Anyone | Admin |
| Drafts and archived rows, article revisions | Postgres | Admin | Admin |
| Private workspace (inbox, jobs, career, resumes, AI usage) | `entries`, `private_config` | Admin | Admin |
| Admin allowlist, profiles | `admin_allowlist`, `profiles` | Admin | Admin (allowlist rows are added in the Supabase dashboard) |
| Uploaded files | Storage bucket `media` (public) | Anyone with the URL | Admin |
| Service-role key, AI API key | Vercel env, `.env.local` (gitignored) | Server only | — |

## Actors

- **Visitor**: anonymous, no session. Uses the site and can call the Supabase API directly
  with the public anon key, which ships to the browser.
- **Signed-in non-admin**: someone with a valid Supabase account who isn't in `admin_allowlist`.
- **Admin**: one person, signed in with email and password, whose email is in `admin_allowlist`.
- **Third parties**: the AI provider (DeepSeek by default) and any site the admin saves a link to.

## Trust boundaries

1. **Browser → Next.js server.** Everything from the browser is untrusted, including Server
   Action arguments. Every admin page and action calls `requireAdmin()` (`src/lib/auth.ts`).
2. **Next.js → Postgres.** Postgres decides. Public pages use the anon key without cookies, and
   admin code uses the user's own session, so **RLS applies to every query the app makes**.
   The only exception is the visit counter (`supabaseService()`), which can only increment one number.
3. **Server → outside world.** Link previews fetch pages chosen by the admin, and the AI
   features send text to the AI provider.

## Threats and mitigations

| Threat | Mitigation | Proof |
| --- | --- | --- |
| Visitor reads a draft, revision or private row through the API | RLS lets anon see published rows only. Children of unpublished projects are hidden. Private tables have no anon grants | `scripts/check-rls.mjs` (read-only, against production); `tests/migration-workspace.test.ts` |
| Signed-in non-admin reads or writes admin data | RLS policies call `public.is_admin()` (allowlist lookup), not just "authenticated". `requireAdmin()` also redirects on the server | `tests/migration-workspace.test.ts` (non-admin locked out); e2e `/admin` redirect |
| Admin form sets a protected column (`state`, `published_at`, `id`, timestamps) or writes to an unlisted table | `src/lib/admin-fields.ts` is the server allowlist. Publishing goes only through the transitions in `src/lib/form.ts` | `tests/admin-rules.test.ts` |
| Private workspace leaks onto a public page or into the cache | Only `src/app/admin` may query `entries` / `private_config`, and nothing there is revalidated on a public path | `tests/privacy.test.ts` |
| A server-only secret or module reaches the browser bundle | Only the anon key has a `NEXT_PUBLIC_` prefix. No client component imports `@/lib/ai`, `ai-prompts` or `fetch-page` | `tests/privacy.test.ts` |
| A public page renders empty because a query failed silently, which would look like content was deleted | `fetchOrThrow` turns failures into errors. A failed build keeps the previous deployment | `tests/db-fetch.test.ts` |
| Malicious upload (script inside an SVG, a disguised executable) | File type is read from the file's first bytes. SVG is not allowed. The stored name is generated. Max 4 MB. Storage RLS lets only the admin write or list | `tests/media.test.ts`; `check-rls.mjs` (anon can't list `media`) |
| Stored XSS through Markdown | `react-markdown` without `rehype-raw`: raw HTML is never rendered, and its default URL filter removes `javascript:`-style links (`src/components/markdown.tsx`) | `tests/markdown-render.test.ts` |
| Clickjacking, injected third-party scripts or frames | CSP (`script-src 'self'`, `frame-ancestors 'none'`, `frame-src` limited to the privacy-enhanced `youtube-nocookie.com` player), `X-Frame-Options: DENY`, HSTS, `nosniff` (`next.config.ts`). Only YouTube hosts become embeds (`youtubeId`) | Response headers; `tests/blog.test.ts` |
| Link preview used to probe the internal network (SSRF) | `isFetchableUrl` refuses non-http(s) URLs, localhost, private, link-local and IPv4-mapped IPv6 addresses. `fetchPage` repeats the check on every redirect hop (max 5) and on every address the host name resolves to. 4 s timeout, 256 KB cap. Admin-only | `tests/entries.test.ts`, `tests/fetch-page.test.ts` |
| Private data sent to the AI provider, or runaway AI cost | Prompts include only the entry the admin pressed the button on, never salary or the career profile. Monthly token cap (default 2,000,000). AI is off without an API key | `tests/ai.test.ts` |
| Visit count inflated from the browser | `increment_visit_count()` is executable by `service_role` only | `tests/migration-visits.test.ts` |
| Login page reveals whether an account exists | The error message is generic | `src/app/login/form.tsx` |

## Known limits

- **Base schema isn't in the repo.** The original tables, their RLS policies and `is_admin()`
  were created in the Supabase dashboard. Only later changes are migrations. `check-rls.mjs`
  checks the live result, but a fresh database can't be rebuilt from this repository yet.
- **DNS rebinding:** link previews check the resolved addresses, then `fetch` resolves the name
  again. A hostile DNS server could answer differently the second time. Only the admin can
  trigger a fetch, and on Vercel there's no internal network to reach. Pinning the checked IP
  with a custom agent would close it.
- **CSP allows inline scripts and styles**, because Next.js needs them without per-request
  nonces. External scripts and framing are still blocked.
- **Login rate limiting** is Supabase Auth's own. The app adds none.
- **Uploaded files are public by URL.** Don't upload anything private to Media.
- **AI text leaves the system.** Whatever entry the admin sends goes to the configured provider
  and is subject to its retention policy.
- **Pending migrations:** until the migrations in `docs/maintenance.md` §0 are applied, the
  `media` bucket runs on whatever policies it has today, and the workspace tables don't exist.

## Deployment checklist

- [ ] Public sign-ups are disabled in Supabase Authentication (only allowlisted admins need accounts)
- [ ] Vercel has `SUPABASE_SERVICE_ROLE_KEY` server-side only, never with a `NEXT_PUBLIC_` prefix
- [ ] `.env.local` stays untracked (`git check-ignore .env.local`)
- [ ] `node --env-file=.env.local scripts/check-rls.mjs` passes after any RLS or query change
- [ ] GitHub Actions has only the anon URL and key as secrets

## Reporting

Found a problem? Email the address on the site's About page rather than opening a public issue.
