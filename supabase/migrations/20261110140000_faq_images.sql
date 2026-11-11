-- Preguntas frecuentes, fase 2: imagen de apoyo opcional por pregunta
-- (docs/plan-preguntas-frecuentes.md).
--
-- Los archivos van en el bucket público faq-images de Supabase Storage (PNG, JPG o WebP, hasta
-- 2 MB). Cualquiera los ve por su URL pública (/storage/v1/object/public/faq-images/<archivo>); solo
-- preguntas.gestionar sube o borra. Sin política SELECT para el público: nadie lista el bucket.
-- La pregunta guarda el nombre del archivo y su texto alternativo (obligatorio si hay imagen).

-- ---------------------------------------------------------------------------------------------
-- Columnas.
-- ---------------------------------------------------------------------------------------------
alter table public.faq_questions add column if not exists image_path text;
alter table public.faq_questions add column if not exists image_alt text;

-- El navegador nombra el archivo con un UUID nuevo y la extensión de su tipo.
alter table public.faq_questions drop constraint if exists faq_questions_image_path_chk;
alter table public.faq_questions add constraint faq_questions_image_path_chk
  check (image_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$');

alter table public.faq_questions drop constraint if exists faq_questions_image_alt_chk;
alter table public.faq_questions add constraint faq_questions_image_alt_chk
  check (char_length(image_alt) between 5 and 200 and image_alt = btrim(image_alt));

-- Imagen y texto alternativo van juntos.
alter table public.faq_questions drop constraint if exists faq_questions_image_pair_chk;
alter table public.faq_questions add constraint faq_questions_image_pair_chk
  check ((image_path is null) = (image_alt is null));

grant select (image_path, image_alt) on table public.faq_questions to anon, authenticated;
grant insert (image_path, image_alt) on table public.faq_questions to authenticated;
grant update (image_path, image_alt) on table public.faq_questions to authenticated;

-- Cambiar la imagen cuenta como modificación (updated_at / updated_by). Igual que en
-- 20261110120000_faq.sql, más las dos columnas nuevas.
create or replace function public.faq_questions_before_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.position := coalesce(
      (select max(q.position) from public.faq_questions q where q.section_id = new.section_id), 0
    ) + 1;
    new.created_at := now();
    new.updated_at := now();
    new.created_by := (select auth.uid());
    new.updated_by := new.created_by;
    return new;
  end if;

  new.created_at := old.created_at;
  new.created_by := old.created_by;
  -- Al cambiar de sección, queda al final de la nueva.
  if new.section_id is distinct from old.section_id then
    new.position := coalesce(
      (select max(q.position) from public.faq_questions q where q.section_id = new.section_id), 0
    ) + 1;
  end if;
  -- Reordenar no cuenta como modificación.
  if (new.section_id, new.question, new.answer, new.is_published, new.image_path, new.image_alt)
     is distinct from (old.section_id, old.question, old.answer, old.is_published, old.image_path, old.image_alt) then
    new.updated_at := now();
    new.updated_by := (select auth.uid());
  else
    new.updated_at := old.updated_at;
    new.updated_by := old.updated_by;
  end if;
  return new;
end;
$$;

revoke execute on function public.faq_questions_before_write() from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Bucket y políticas de Storage.
-- ---------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('faq-images', 'faq-images', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- SELECT solo para quien gestiona: la API de Storage lo necesita para borrar. El público ve las
-- imágenes por la URL pública del bucket, que no pasa por estas políticas.
drop policy if exists faq_images_select on storage.objects;
create policy faq_images_select on storage.objects
  for select to authenticated
  using (bucket_id = 'faq-images' and (select public.has_permission('preguntas.gestionar')));

drop policy if exists faq_images_insert on storage.objects;
create policy faq_images_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'faq-images' and (select public.has_permission('preguntas.gestionar')));

drop policy if exists faq_images_delete on storage.objects;
create policy faq_images_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'faq-images' and (select public.has_permission('preguntas.gestionar')));
