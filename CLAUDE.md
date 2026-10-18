# CLAUDE.md

Read [AGENTS.md](AGENTS.md) — it holds the working rules for this repo (invariants, conventions,
the checks to run, git rules) and applies to Claude Code in full. [README.md](README.md) is the
accurate description of what exists; [docs/maintenance.md](docs/maintenance.md) has the pending
migration and settings audit.

Claude-specific notes on top of that:

## Orientation

- **Entry points:** `src/app/` routes, `src/app/admin/actions.ts` (every admin write),
  `src/lib/queries.ts` (every public read), `src/middleware.ts` (session refresh, `/admin`
  redirect, visit counter).
- Before changing a public page, read `src/lib/db.ts`; before changing an admin form, read
  `src/lib/admin-fields.ts`. Those two files carry the rules the rest of the code assumes.
- Grep for callers before editing a shared helper in `src/lib` — one guard there beats a guard in
  each caller, and patching one route leaves its siblings broken.

## Tools

- Prefer the Supabase MCP server over guessing at the schema; it needs authorization in an
  interactive session, and read-only inspection is always fine. Writes to the production database
  need explicit approval first.
- `graphify-out/` (when present) is a knowledge graph of this repo — query it before a broad
  code search.
- Skills worth reaching for here: `feature-tracer` (trace a route end to end),
  `architecture-map`, `tech-stack-radar`, `code-review`, `security-review` (RLS/auth changes).

## Scope

Do the asked change and the checks in AGENTS.md; don't drift into refactors, scaffolding or
speculative abstractions. If something looks wrong nearby, say so in a line rather than fixing it
unasked.
