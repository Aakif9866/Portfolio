-- Atomic page-view counter.
--
-- Before: the middleware read site_config.visit_count, added one in the app and wrote it
-- back, so two concurrent views could both write the same number. Now a single UPDATE
-- does the increment inside Postgres. Additive only: one function and its grants.
--
-- Callable only by service_role (the middleware's visit counter). anon and authenticated
-- cannot call it, so nobody can inflate the count from the browser.

create or replace function public.increment_visit_count()
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.site_config (key, value, label, "group")
  -- value is jsonb; the count is stored as a JSON string ("771"), as the app writes it.
  values ('visit_count', '"1"', 'Visit count', 'internal')
  on conflict (key) do update
    set value = to_jsonb(((coalesce(nullif(public.site_config.value #>> '{}', ''), '0'))::bigint + 1)::text);
$$;

revoke all on function public.increment_visit_count() from public, anon, authenticated;
grant execute on function public.increment_visit_count() to service_role;

-- rollback:
-- drop function if exists public.increment_visit_count();
