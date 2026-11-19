-- Remove the 9 obsolete site_config rows (docs/maintenance.md §2).
--
-- Seeded on 2026-10-05 for an earlier design and never read by any version of the app:
-- navigation and hero buttons are hard-coded (two pointed at /writing, which does not exist),
-- and the headings were replaced by descriptive ones. They only show up as read-only
-- "Other stored settings" in Admin → Settings. Data only; no schema change.
--
-- Backup first (keep the output):
--   select jsonb_agg(c) from public.site_config c where key in ('nav.items', 'hero.primary_cta', 'hero.secondary_cta', 'projects.title', 'projects.description', 'home.work_title', 'home.lab_title', 'home.system_title', 'home.writing_title');

delete from public.site_config where key in (
  'nav.items', 'hero.primary_cta', 'hero.secondary_cta', 'projects.title', 'projects.description', 'home.work_title', 'home.lab_title', 'home.system_title', 'home.writing_title'
);

-- rollback (values from the 2026-11-18 snapshot):
-- insert into public.site_config (key, value, label, description, "group", position) values
--   ('hero.primary_cta', '{"href":"/projects","label":"Explore work"}'::jsonb, 'Hero primary button', null, 'home', 1),
--   ('hero.secondary_cta', '{"href":"/writing","label":"Read writing"}'::jsonb, 'Hero secondary button', null, 'home', 2),
--   ('nav.items', '[{"href":"/projects","label":"Work"},{"href":"/system","label":"System"},{"href":"/lab","label":"Lab"},{"href":"/writing","label":"Writing"},{"href":"/about","label":"About"}]'::jsonb, 'Navigation links', null, 'navigation', 0),
--   ('home.work_title', '"Things worth building"'::jsonb, 'Home — work heading', null, 'home', 4),
--   ('home.lab_title', '"Where unfinished things live"'::jsonb, 'Home — lab heading', null, 'home', 6),
--   ('home.system_title', '"Everything, and what it connects to"'::jsonb, 'Home — system heading', null, 'home', 8),
--   ('home.writing_title', '"Notes from building things"'::jsonb, 'Home — writing heading', null, 'home', 10),
--   ('projects.title', '"Things worth building"'::jsonb, 'Work page heading', null, 'work', 0),
--   ('projects.description', '"Each one is a case study: the problem, the architecture, the decisions, and what broke along the way."'::jsonb, 'Work page description', null, 'work', 1);
