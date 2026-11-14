-- 0004_storage.sql
-- Image storage for topic figures: a public-read bucket with strict write rules.
--  * Only PNG/JPEG/WebP up to 2 MB (enforced by the bucket; the app also checks magic bytes). No SVG (script risk).
--  * Objects must live under "<topic_id>/..." and may be written only by someone who can currently edit that topic
--    (author with MFA while draft/changes_requested, or an administrator) - same rule as the topic's other content.
--  * Image metadata rows must point at a path inside their own topic's folder.
-- The storage schema exists on Supabase but not on plain PostgreSQL; storage objects are skipped when it is absent.

create or replace function public.try_uuid(p text) returns uuid
language plpgsql immutable set search_path = pg_temp as $$
begin
  return p::uuid;
exception when others then
  return null;
end $$;
grant execute on function public.try_uuid(text) to authenticated, anon;

alter table public.topic_images
  add constraint topic_images_path_in_topic_folder
  check (storage_path like topic_id::text || '/%' and storage_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]+\.(png|jpg|jpeg|webp)$');

do $$
begin
  if to_regnamespace('storage') is null then
    raise notice 'storage schema not found: skipping bucket and policies';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('topic-images', 'topic-images', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
  on conflict (id) do update
    set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

  execute $p$ drop policy if exists topic_images_select on storage.objects $p$;
  execute $p$ create policy topic_images_select on storage.objects for select to authenticated
    using (bucket_id = 'topic-images' and public.can_read_topic(public.try_uuid((storage.foldername(name))[1]))) $p$;
  execute $p$ drop policy if exists topic_images_insert on storage.objects $p$;
  execute $p$ create policy topic_images_insert on storage.objects for insert to authenticated
    with check (bucket_id = 'topic-images' and public.can_edit_topic(public.try_uuid((storage.foldername(name))[1]))) $p$;
  execute $p$ drop policy if exists topic_images_update on storage.objects $p$;
  execute $p$ create policy topic_images_update on storage.objects for update to authenticated
    using (bucket_id = 'topic-images' and public.can_edit_topic(public.try_uuid((storage.foldername(name))[1])))
    with check (bucket_id = 'topic-images' and public.can_edit_topic(public.try_uuid((storage.foldername(name))[1]))) $p$;
  execute $p$ drop policy if exists topic_images_delete on storage.objects $p$;
  execute $p$ create policy topic_images_delete on storage.objects for delete to authenticated
    using (bucket_id = 'topic-images' and public.can_edit_topic(public.try_uuid((storage.foldername(name))[1]))) $p$;
end $$;
