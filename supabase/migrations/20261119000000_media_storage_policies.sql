-- Supabase Storage: the `media` bucket, writable by the admin only.
--
-- The bucket already exists (created 2026-10-05: public, 5 MB, images incl. SVG). Its
-- write policies aren't in this repo, so this migration makes them explicit and uses
-- public.is_admin(), the same helper the table policies rely on.
--
-- BEFORE APPLYING, list the existing policies and drop any that let non-admins write:
--   select policyname, cmd, roles, qual, with_check
--   from pg_policies where schemaname = 'storage' and tablename = 'objects';
--
-- Reads need no policy: a public bucket serves files by URL to anyone. The select policy
-- below only lets the admin *list* files (Admin → Media); anon listing stays empty.

-- Allowed types: SVG is dropped (it can carry script), PDF and GIF are added.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880,
        array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif', 'application/pdf'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media: admin can list" on storage.objects;
drop policy if exists "media: admin can upload" on storage.objects;
drop policy if exists "media: admin can update" on storage.objects;
drop policy if exists "media: admin can delete" on storage.objects;

create policy "media: admin can list" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and public.is_admin());

create policy "media: admin can upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

create policy "media: admin can update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

create policy "media: admin can delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

-- rollback:
-- drop policy if exists "media: admin can list" on storage.objects;
-- drop policy if exists "media: admin can upload" on storage.objects;
-- drop policy if exists "media: admin can update" on storage.objects;
-- drop policy if exists "media: admin can delete" on storage.objects;
-- update storage.buckets set allowed_mime_types =
--   array['image/png','image/jpeg','image/webp','image/avif','image/svg+xml'] where id = 'media';
