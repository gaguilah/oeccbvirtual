-- Mi perfil: una fecha de última actualización por pestaña (docs/plan-correcciones-revision.md, punto 3).
--
-- updated_at es de la fila: guardar Información personal cambiaba también la fecha que mostraba
-- Contacto de emergencia (y el modal de Usuarios). personal_updated_at y emergency_updated_at las
-- pone un trigger, solo cuando cambia alguna columna de su grupo, y quedan en null cuando el grupo
-- se vacía ("Quitar estos datos"). No se escriben desde el navegador (sin grant de insert ni update;
-- el grant de select de la tabla ya las cubre). Los grupos de columnas se repiten en
-- src/dashboard/profile/personalApi.ts (PERSONAL_COLUMNS, EMERGENCY_COLUMNS): cambiar los dos juntos.
-- Idempotente.

alter table public.profile_personal_info
  add column if not exists personal_updated_at timestamptz,
  add column if not exists emergency_updated_at timestamptz;

-- Filas existentes: la fecha de la fila para cada grupo con datos. Sin el trigger de updated_at,
-- que la cambiaría a now(), ni el de las fechas (si la migración se repite ya existe y dejaría la
-- fecha como estaba, porque el grupo no cambia); se vuelve a crear más abajo.
drop trigger if exists profile_personal_info_section_dates on public.profile_personal_info;
alter table public.profile_personal_info disable trigger profile_personal_info_set_updated_at;

update public.profile_personal_info
set personal_updated_at = updated_at
where personal_updated_at is null
  and num_nonnulls(residence_address, mobile_phone, personal_email, eps_id) > 0;

update public.profile_personal_info
set emergency_updated_at = updated_at
where emergency_updated_at is null
  and num_nonnulls(emergency_name, emergency_relationship, emergency_phone) > 0;

alter table public.profile_personal_info enable trigger profile_personal_info_set_updated_at;

create or replace function public.profile_personal_info_section_dates()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if num_nonnulls(new.residence_address, new.mobile_phone, new.personal_email, new.eps_id) = 0 then
    new.personal_updated_at := null;
  elsif tg_op = 'INSERT'
    or (new.residence_address, new.mobile_phone, new.personal_email, new.eps_id)
      is distinct from (old.residence_address, old.mobile_phone, old.personal_email, old.eps_id) then
    new.personal_updated_at := now();
  else
    new.personal_updated_at := old.personal_updated_at;
  end if;

  if num_nonnulls(new.emergency_name, new.emergency_relationship, new.emergency_phone) = 0 then
    new.emergency_updated_at := null;
  elsif tg_op = 'INSERT'
    or (new.emergency_name, new.emergency_relationship, new.emergency_phone)
      is distinct from (old.emergency_name, old.emergency_relationship, old.emergency_phone) then
    new.emergency_updated_at := now();
  else
    new.emergency_updated_at := old.emergency_updated_at;
  end if;

  return new;
end;
$$;

drop trigger if exists profile_personal_info_section_dates on public.profile_personal_info;
create trigger profile_personal_info_section_dates
  before insert or update on public.profile_personal_info
  for each row execute function public.profile_personal_info_section_dates();

-- get_user_personal_info devuelve también las dos fechas. Cambia el tipo de retorno, así que se
-- recrea; updated_at se conserva para que la versión anterior de la app siga funcionando.
-- Mismo cuerpo, seguridad y grants que en 20261027120000.
drop function if exists public.get_user_personal_info(uuid);

create function public.get_user_personal_info(p_user_id uuid)
returns table (
  residence_address text,
  mobile_phone text,
  personal_email text,
  eps_name text,
  emergency_name text,
  emergency_relationship text,
  emergency_phone text,
  updated_at timestamptz,
  personal_updated_at timestamptz,
  emergency_updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_court smallint;
begin
  select coalesce(p.court, 0) into v_court from public.profiles p where p.id = p_user_id;

  if not found or not public.has_permission('usuarios.datos_personales', v_court) then
    raise exception 'forbidden' using errcode = '42501', hint = 'Requiere el permiso usuarios.datos_personales.';
  end if;

  return query
    select i.residence_address, i.mobile_phone, i.personal_email, e.name,
      i.emergency_name, i.emergency_relationship, i.emergency_phone, i.updated_at,
      i.personal_updated_at, i.emergency_updated_at
    from public.profile_personal_info i
    left join public.eps_entities e on e.id = i.eps_id
    where i.user_id = p_user_id;
end;
$$;

revoke execute on function public.get_user_personal_info(uuid) from public, anon;
grant execute on function public.get_user_personal_info(uuid) to authenticated;
