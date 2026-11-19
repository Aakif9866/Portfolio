-- Blog: tags, a cover image and a companion video per article.
--
-- Additive only: three nullable/defaulted columns on articles. They inherit the table's
-- existing RLS policies and grants, so anon still sees published rows only. URLs are
-- validated by the admin form (src/lib/admin-fields.ts); tags are free text, matched
-- case-insensitively by slug on /articles/tag/[tag].

alter table public.articles
  add column if not exists tags text[] not null default '{}',
  add column if not exists cover_image_url text,
  add column if not exists video_url text;

-- rollback:
-- alter table public.articles drop column if exists tags, drop column if exists cover_image_url, drop column if exists video_url;
