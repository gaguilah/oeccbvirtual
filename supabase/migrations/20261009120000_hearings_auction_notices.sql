-- Audiencias, fase 3: integración con Avisos de Remate (docs/plan-audiencias.md).
--
-- 1. Un aviso puede tener su "Audiencia de Remate" (hearings.auction_notice_id, una por aviso).
--    create_auction_notice_with_hearing() crea los dos en una sola transacción: o se guardan los
--    dos o ninguno. Si ya existe una audiencia del mismo radicado a esa hora sin aviso, la vincula.
-- 2. Si cambian el radicado, el juzgado o la fecha y hora del aviso, la audiencia vinculada se
--    mueve igual mientras siga Programada. Las reglas de audiencias (día hábil, horario, saltos de
--    15 minutos) se aplican: si no se cumplen, el cambio del aviso no se guarda.
-- 3. Si se elimina el aviso, la audiencia se elimina también solo si cumple las condiciones de
--    eliminar (futura, Programada, sin enlace ni grabación); si no, se conserva marcada
--    auction_notice_deleted para mostrar "Aviso de remate eliminado".

alter table public.hearings
  add column if not exists auction_notice_id uuid references public.auction_notices (id) on delete set null;
alter table public.hearings
  add column if not exists auction_notice_deleted boolean not null default false;

create unique index if not exists hearings_auction_notice_key
  on public.hearings (auction_notice_id) where auction_notice_id is not null;

-- ---------------------------------------------------------------------------------------------
-- Crear aviso + audiencia (security invoker: aplican RLS, permisos de remates y de audiencias,
-- y los triggers de ambos).
-- ---------------------------------------------------------------------------------------------
create or replace function public.create_auction_notice_with_hearing(
  p_case_number text,
  p_court smallint,
  p_scheduled_at timestamptz,
  p_is_published boolean
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_notice uuid;
  v_type smallint;
  v_existing uuid;
begin
  insert into public.auction_notices (case_number, court, scheduled_at, is_published)
  values (p_case_number, p_court, p_scheduled_at, coalesce(p_is_published, false))
  returning id into v_notice;

  select h.id into v_existing
  from public.hearings h
  where h.case_number = p_case_number and h.scheduled_at = p_scheduled_at and h.auction_notice_id is null;

  if v_existing is not null then
    perform public.link_hearing_to_notice(v_existing, v_notice);
    return v_notice;
  end if;

  select t.id into v_type
  from public.hearing_types t
  where lower(t.description) = 'audiencia de remate' and t.is_active;
  if v_type is null then
    raise exception 'remate_type_missing' using hint = 'No existe el tipo activo "Audiencia de Remate".';
  end if;

  insert into public.hearings (scheduled_at, hearing_type_id, case_number, court_id)
  values (p_scheduled_at, v_type, p_case_number, p_court);

  perform public.link_hearing_to_notice(
    (select h.id from public.hearings h where h.case_number = p_case_number and h.scheduled_at = p_scheduled_at),
    v_notice
  );
  return v_notice;
end;
$$;

-- Escribe el vínculo (la columna no se escribe desde el navegador). Solo la llama la función de
-- arriba: comprueba que la audiencia y el aviso sean del mismo radicado, juzgado y hora.
create or replace function public.link_hearing_to_notice(p_hearing uuid, p_notice uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.hearings h
    join public.auction_notices n on n.id = p_notice
    where h.id = p_hearing
      and h.case_number = n.case_number and h.court_id = n.court and h.scheduled_at = n.scheduled_at
      and public.has_permission('audiencias.crear', h.court_id)
  ) then
    raise exception 'link_mismatch';
  end if;
  update public.hearings set auction_notice_id = p_notice where id = p_hearing;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Sincronizar la audiencia al editar o eliminar el aviso. security definer: la audiencia sigue a
-- su aviso aunque quien edita no tenga permisos de audiencias; las reglas de fecha de
-- hearings_rules se siguen aplicando (auth.uid() es quien edita el aviso).
-- ---------------------------------------------------------------------------------------------
create or replace function public.auction_notices_sync_hearing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if (new.case_number, new.court, new.scheduled_at) is distinct from (old.case_number, old.court, old.scheduled_at) then
      update public.hearings
         set case_number = new.case_number, court_id = new.court, scheduled_at = new.scheduled_at
       where auction_notice_id = new.id and status_id = 1;
    end if;
    return new;
  end if;

  -- DELETE (antes de borrar el aviso, mientras el vínculo existe): borrar la audiencia si cumple
  -- las condiciones; si no, marcarla.
  delete from public.hearings
   where auction_notice_id = old.id
     and status_id = 1 and scheduled_at > now() and connection_url is null and recording_url is null;
  update public.hearings set auction_notice_deleted = true where auction_notice_id = old.id;
  return old;
end;
$$;

-- Al borrar va antes (BEFORE): después, la llave ya habría puesto auction_notice_id en null.
drop trigger if exists auction_notices_sync_hearing on public.auction_notices;
create trigger auction_notices_sync_hearing
  after update on public.auction_notices
  for each row execute function public.auction_notices_sync_hearing();

drop trigger if exists auction_notices_sync_hearing_delete on public.auction_notices;
create trigger auction_notices_sync_hearing_delete
  before delete on public.auction_notices
  for each row execute function public.auction_notices_sync_hearing();

-- hearings_rules no compara auction_notice_id ni auction_notice_deleted: marcar una audiencia
-- cerrada como "aviso eliminado" no choca con la regla de audiencias cerradas.

revoke execute on function public.create_auction_notice_with_hearing(text, smallint, timestamptz, boolean) from public, anon;
revoke execute on function public.link_hearing_to_notice(uuid, uuid) from public, anon;
revoke execute on function public.auction_notices_sync_hearing() from public, anon, authenticated;
grant execute on function public.create_auction_notice_with_hearing(text, smallint, timestamptz, boolean) to authenticated;
-- La llama create_auction_notice_with_hearing (security invoker, como el usuario); comprueba ella
-- misma el permiso y que audiencia y aviso coincidan.
grant execute on function public.link_hearing_to_notice(uuid, uuid) to authenticated;
