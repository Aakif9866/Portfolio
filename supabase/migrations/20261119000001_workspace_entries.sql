-- Private workspace: one table for everything you capture, plus a private key/value store.
--
-- PRIVATE BY CONSTRUCTION: RLS is on, the only policy is "the admin can do anything"
-- (public.is_admin(), the helper the table policies use), and anon has no grants at all.
-- No public page queries these tables; tests/privacy.test.ts fails if one starts to.
-- Additive only: two new tables, one trigger function. Nothing existing changes.

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'note' check (kind in ('note', 'link', 'log', 'idea', 'goal', 'job')),
  title text not null default '' check (char_length(title) <= 300),
  body_md text not null default '' check (char_length(body_md) <= 100000),
  url text check (url is null or url ~* '^https?://\S+$'),
  tags text[] not null default '{}' check (cardinality(tags) <= 20),
  status text,
  pinned boolean not null default false,
  due_on date,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entries_has_title_or_url check (title <> '' or url is not null)
);

create index entries_created_idx on public.entries (created_at desc);
create index entries_kind_idx on public.entries (kind, status);
create index entries_tags_idx on public.entries using gin (tags);

-- Small private settings that aren't rows: career profile, resume master, AI usage.
create table public.private_config (
  key text primary key check (key ~ '^[a-z][a-z0-9_.]*$'),
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger entries_touch before update on public.entries
  for each row execute function public.touch_updated_at();
create trigger private_config_touch before update on public.private_config
  for each row execute function public.touch_updated_at();

alter table public.entries enable row level security;
alter table public.private_config enable row level security;

revoke all on public.entries, public.private_config from anon, public;
grant select, insert, update, delete on public.entries, public.private_config to authenticated;

create policy "entries: admin only" on public.entries
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "private_config: admin only" on public.private_config
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- rollback (drops the data — take a backup first: scripts/backup-db.mjs):
-- drop table if exists public.entries;
-- drop table if exists public.private_config;
-- drop function if exists public.touch_updated_at();
