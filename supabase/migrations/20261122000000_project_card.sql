-- Share card per project, opt-in: the card exists only when card_enabled is on, and says only
-- what the admin wrote (used for, key features) plus the project's own technologies and hero image.
--
-- Additive only: three defaulted/nullable columns on projects. They inherit the table's existing
-- RLS policies and grants, so anon still sees published rows only.

alter table public.projects
  add column if not exists card_enabled boolean not null default false,
  add column if not exists card_used_for text,
  add column if not exists card_features text[] not null default '{}';

-- rollback:
-- alter table public.projects drop column if exists card_enabled, drop column if exists card_used_for, drop column if exists card_features;
