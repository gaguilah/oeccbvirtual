-- Gestión de Avisos de Remate desde el dashboard (docs/plan-remates-dashboard.md).
--
-- Permisos del módulo remates, con alcance por juzgado: un usuario de alcance 'court' solo actúa
-- sobre los avisos de su juzgado (has_permission('remates.x', court)). RLS decide por fila; el
-- trigger auction_notices_authorize completa lo que RLS no puede expresar por columna (publicar
-- es un permiso aparte de editar los datos). El SQL Editor y el Table Editor (sin usuario) siguen
-- funcionando como antes.

-- ---------------------------------------------------------------------------------------------
-- Auditoría sencilla: quién creó y quién editó por última vez (updated_at ya existe).
-- ---------------------------------------------------------------------------------------------
alter table public.auction_notices
  add column if not exists created_by uuid references auth.users (id) on delete set null;
alter table public.auction_notices
  add column if not exists updated_by uuid references auth.users (id) on delete set null;

-- ---------------------------------------------------------------------------------------------
-- Trigger de permisos por columna. Se llama "authorize" para ejecutarse antes que
-- auction_notices_before_write (los triggers BEFORE corren en orden alfabético): revisa lo que
-- envió el usuario, antes de que se regenere la URL.
-- ---------------------------------------------------------------------------------------------
create or replace function public.auction_notices_authorize()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  -- Sin usuario (SQL Editor, Table Editor, service role): sin cambios respecto a antes.
  if v_user is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Quien no puede publicar crea el aviso oculto, aunque envíe is_published = true.
    if new.is_published and not public.has_permission('remates.publicar', new.court) then
      new.is_published := false;
    end if;
    new.created_by := v_user;
    new.updated_by := null;
    return new;
  end if;

  -- UPDATE: cambiar los datos exige editar (en el juzgado de antes y en el de después).
  if (new.case_number, new.court, new.scheduled_at, new.pdf_url)
     is distinct from (old.case_number, old.court, old.scheduled_at, old.pdf_url) then
    if not (public.has_permission('remates.editar', old.court)
            and public.has_permission('remates.editar', new.court)) then
      raise exception 'remates_editar_required' using errcode = '42501';
    end if;
  end if;

  -- Publicar u ocultar exige publicar.
  if new.is_published is distinct from old.is_published
     and not public.has_permission('remates.publicar', new.court) then
    raise exception 'remates_publicar_required' using errcode = '42501';
  end if;

  new.created_by := old.created_by;
  new.updated_by := v_user;
  return new;
end;
$$;

drop trigger if exists auction_notices_authorize on public.auction_notices;
create trigger auction_notices_authorize
  before insert or update on public.auction_notices
  for each row execute function public.auction_notices_authorize();

revoke execute on function public.auction_notices_authorize() from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- RLS de auction_notices. La política pública de los publicados se mantiene; esta se suma (OR).
-- ---------------------------------------------------------------------------------------------
drop policy if exists auction_notices_select_admin on public.auction_notices;
create policy auction_notices_select_admin on public.auction_notices
  for select to authenticated
  using ((select public.has_permission('remates.ver', court)));

drop policy if exists auction_notices_insert on public.auction_notices;
create policy auction_notices_insert on public.auction_notices
  for insert to authenticated
  with check ((select public.has_permission('remates.crear', court)));

-- using: la fila actual es de su juzgado; with check: la fila nueva también.
drop policy if exists auction_notices_update on public.auction_notices;
create policy auction_notices_update on public.auction_notices
  for update to authenticated
  using ((select public.has_permission('remates.editar', court) or public.has_permission('remates.publicar', court)))
  with check ((select public.has_permission('remates.editar', court) or public.has_permission('remates.publicar', court)));

drop policy if exists auction_notices_delete on public.auction_notices;
create policy auction_notices_delete on public.auction_notices
  for delete to authenticated
  using ((select public.has_permission('remates.eliminar', court)));

-- Grants: el navegador solo escribe estas columnas (created_by, updated_by, created_at y
-- updated_at los pone la base de datos).
revoke insert, update, delete on table public.auction_notices from anon, authenticated;
grant insert (case_number, court, scheduled_at, pdf_url, is_published) on table public.auction_notices to authenticated;
grant update (case_number, court, scheduled_at, pdf_url, is_published) on table public.auction_notices to authenticated;
grant delete on table public.auction_notices to authenticated;

-- ---------------------------------------------------------------------------------------------
-- pdf_folders: la leen quienes escriben avisos (el trigger de la URL es security invoker y el
-- formulario muestra la vista previa) y quienes administran carpetas. Las carpetas no se editan:
-- se agrega una nueva; solo se borra una futura, que todavía no usa ningún aviso.
-- ---------------------------------------------------------------------------------------------
revoke all on table public.pdf_folders from anon, authenticated;
grant select on table public.pdf_folders to authenticated;
grant insert (group_id, folder_id, valid_from) on table public.pdf_folders to authenticated;
grant delete on table public.pdf_folders to authenticated;

drop policy if exists pdf_folders_select on public.pdf_folders;
create policy pdf_folders_select on public.pdf_folders
  for select to authenticated
  using ((select public.has_permission('remates.crear')
          or public.has_permission('remates.editar')
          or public.has_permission('remates.carpetas')));

drop policy if exists pdf_folders_insert on public.pdf_folders;
create policy pdf_folders_insert on public.pdf_folders
  for insert to authenticated
  with check ((select public.has_permission('remates.carpetas')));

drop policy if exists pdf_folders_delete on public.pdf_folders;
create policy pdf_folders_delete on public.pdf_folders
  for delete to authenticated
  using (
    (select public.has_permission('remates.carpetas'))
    and valid_from > (now() at time zone 'America/Bogota')::date
  );

-- ---------------------------------------------------------------------------------------------
-- Auditoría para el detalle: nombre (o correo) de quien creó y de quien editó un aviso, solo si
-- quien pregunta puede ver ese aviso. security definer porque lee perfiles y correos ajenos.
-- ---------------------------------------------------------------------------------------------
create or replace function public.auction_notice_audit(p_id uuid)
returns table (created_by_name text, updated_by_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(nullif(trim(cp.full_name), ''), cu.email::text),
    coalesce(nullif(trim(up.full_name), ''), uu.email::text)
  from public.auction_notices n
  left join public.profiles cp on cp.id = n.created_by
  left join auth.users cu on cu.id = n.created_by
  left join public.profiles up on up.id = n.updated_by
  left join auth.users uu on uu.id = n.updated_by
  where n.id = p_id
    and public.has_permission('remates.ver', n.court);
$$;

revoke execute on function public.auction_notice_audit(uuid) from public, anon;
grant execute on function public.auction_notice_audit(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Permisos y asignación inicial (el superadmin los ajusta después en Roles).
-- ---------------------------------------------------------------------------------------------
insert into public.permissions (code, module, name, description) values
  ('remates.ver', 'remates', 'Ver avisos', 'Ver la sección y los avisos, también los ocultos.'),
  ('remates.crear', 'remates', 'Crear avisos', 'Crear avisos de remate.'),
  ('remates.editar', 'remates', 'Editar avisos', 'Cambiar radicado, juzgado, fecha y hora, y corregir la URL del PDF.'),
  ('remates.publicar', 'remates', 'Publicar avisos', 'Publicar u ocultar avisos en el sitio público.'),
  ('remates.eliminar', 'remates', 'Eliminar avisos', 'Borrar avisos definitivamente.'),
  ('remates.carpetas', 'remates', 'Carpetas de publicación', 'Agregar las carpetas del portal con las que se arma la URL del PDF.')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_code)
select r.id, p.code
from public.roles r
join (values
  ('juzgado', 'remates.ver'),
  ('juzgado', 'remates.crear'),
  ('juzgado', 'remates.editar'),
  ('juzgado', 'remates.publicar'),
  ('juzgado', 'remates.eliminar'),
  ('oficina', 'remates.ver')
) as p (role_code, code) on p.role_code = r.code
on conflict do nothing;
