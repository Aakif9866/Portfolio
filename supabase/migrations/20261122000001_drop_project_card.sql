-- The project share card was removed from the app (commit b2119b8); drop its unused columns,
-- added by 20261122000000_project_card. No code reads or writes them.

alter table public.projects
  drop column if exists card_enabled,
  drop column if exists card_used_for,
  drop column if exists card_features;

-- rollback: re-run 20261122000000_project_card.sql (cards come back switched off, fields empty).
