-- Atomic reordering and article revisions.
--
-- NOT YET APPLIED TO PRODUCTION. See docs/maintenance.md for prerequisites,
-- the apply command, the matching app change, and how to roll back.
-- Additive only: two functions, one trigger, grants. No table, column, row
-- or RLS policy is created, changed or removed.

-- ─── 1. swap_positions ─────────────────────────────────────────────────────
-- Replaces the app's two separate UPDATEs (a failure between them could
-- leave two items sharing a position) with one UPDATE inside one function
-- call, i.e. one transaction.
--
-- Contract: afterwards, row `a` sorts before row `b`. With distinct positions
-- that is a plain swap (the app passes the pair accordingly); with equal
-- positions — where a swap would change nothing — a keeps the position and
-- b moves one after it.
--
-- SECURITY INVOKER (the default): runs as the signed-in user, so the existing
-- RLS policies decide which rows may change — exactly as for the app's
-- direct updates today. If RLS hides either row, or fewer than two rows
-- change, it raises and nothing is written.

create or replace function public.swap_positions(tbl text, a uuid, b uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  pa integer;
  pb integer;
  changed integer;
begin
  if tbl not in ('projects', 'project_sections', 'project_milestones', 'technologies',
                 'articles', 'experiments', 'timeline_entries', 'architecture_diagrams') then
    raise exception 'swap_positions: table % is not reorderable', tbl using errcode = '42501';
  end if;
  if a = b then
    raise exception 'swap_positions: cannot swap a row with itself' using errcode = '22023';
  end if;

  -- lock both rows for the rest of the transaction, in a stable order (no deadlocks)
  execute format('select position from public.%I where id = $1 for update', tbl) into pa using least(a, b);
  execute format('select position from public.%I where id = $1 for update', tbl) into pb using greatest(a, b);
  if a > b then select pb, pa into pa, pb; end if;   -- pa belongs to a, pb to b
  if pa is null or pb is null then
    raise exception 'swap_positions: row not found or not permitted' using errcode = 'P0002';
  end if;

  -- new positions: a plain swap, or for a tie, a stays and b goes one after it
  execute format(
    'update public.%I set position = case when id = $1 then $3 else $4 end where id in ($1, $2)', tbl
  ) using a, b,
    case when pa = pb then pa else least(pa, pb) end,
    case when pa = pb then pb + 1 else greatest(pa, pb) end;
  get diagnostics changed = row_count;
  if changed <> 2 then
    raise exception 'swap_positions: expected 2 rows, changed %', changed using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.swap_positions(text, uuid, uuid) from public, anon;
grant execute on function public.swap_positions(text, uuid, uuid) to authenticated;

-- ─── 2. article revisions ──────────────────────────────────────────────────
-- The app snapshots the previous title/body and then saves, as two separate
-- requests; a failed save left a revision of an edit that never happened.
-- This trigger snapshots inside the same transaction as the UPDATE, so both
-- happen or neither does. It fires only when title or body actually change:
-- publishing, archiving and reordering never created revisions, and still
-- don't; a no-op save no longer stores a duplicate copy.
-- SECURITY INVOKER: the revision insert passes the same RLS as the app's
-- insert does today.

create or replace function public.snapshot_article_revision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.article_revisions (article_id, title, body_md)
  values (old.id, old.title, old.body_md);
  return new;
end;
$$;

drop trigger if exists articles_snapshot_revision on public.articles;
create trigger articles_snapshot_revision
  after update on public.articles
  for each row
  when (old.title is distinct from new.title or old.body_md is distinct from new.body_md)
  execute function public.snapshot_article_revision();
