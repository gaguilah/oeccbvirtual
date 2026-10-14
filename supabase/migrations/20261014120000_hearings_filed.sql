-- Marca "Cargado al expediente" de las audiencias realizadas (docs/plan-audiencias-expediente.md).
--
-- filed_at (null = pendiente), filed_by y filed_by_name (copia del nombre en ese momento). El
-- navegador solo puede escribir filed_at (grant de columna; la política hearings_update exige
-- audiencias.editar en el juzgado) y el trigger hearings_filed_rules lo normaliza: al marcar pone la
-- hora del servidor y el usuario; al desmarcar borra las tres; si cambia la grabación, vuelve a
-- pendiente. Solo se marca una Realizada. hearings_rules ya no cuenta un cambio solo de la marca como
-- modificación (no toca updated_at / updated_by).
--
-- Idempotente. Las realizadas existentes se marcan con un SQL aparte (no se versiona).

alter table public.hearings
  add column if not exists filed_at timestamptz,
  add column if not exists filed_by uuid references auth.users (id) on delete set null,
  add column if not exists filed_by_name text;

grant update (filed_at) on table public.hearings to authenticated;

-- security definer: lee auth.users (correo si el perfil no tiene nombre), solo del propio usuario.
create or replace function public.hearings_filed_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.filed_at := null;
    new.filed_by := null;
    new.filed_by_name := null;
    return new;
  end if;

  -- Grabación nueva o corregida: el formato cambió, hay que volver a cargarlo.
  if new.recording_url is distinct from old.recording_url then
    new.filed_at := null;
    new.filed_by := null;
    new.filed_by_name := null;
    return new;
  end if;

  if new.filed_at is not null and old.filed_at is null then
    if new.status_id <> 2 then
      raise exception 'hearing_filed_not_realizada'
        using hint = 'Solo se marca como cargada al expediente una audiencia realizada.';
    end if;
    new.filed_at := now();
    new.filed_by := v_user;
    select coalesce(nullif(btrim(p.full_name), ''), u.email::text)
      into new.filed_by_name
    from auth.users u
    left join public.profiles p on p.id = u.id
    where u.id = v_user;
  elsif new.filed_at is null and old.filed_at is not null then
    new.filed_by := null;
    new.filed_by_name := null;
  else
    -- Sin cambio de la marca: se conserva tal cual (no se puede cambiar la fecha ni el autor).
    new.filed_at := old.filed_at;
    new.filed_by := old.filed_by;
    new.filed_by_name := old.filed_by_name;
  end if;
  return new;
end;
$$;

drop trigger if exists hearings_filed_rules on public.hearings;
create trigger hearings_filed_rules
  before insert or update on public.hearings
  for each row execute function public.hearings_filed_rules();

revoke execute on function public.hearings_filed_rules() from public, anon, authenticated;

-- hearings_rules (20261008150000) con una sola diferencia: al principio del UPDATE, un cambio solo de
-- la marca de expediente no se cuenta como modificación. Los triggers BEFORE corren por orden
-- alfabético: hearings_filed_rules ya normalizó la marca cuando llega aquí.
create or replace function public.hearings_rules()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_error text;
begin
  if tg_op = 'DELETE' then
    if v_user is not null
       and not (old.status_id = 1 and old.scheduled_at > now() and old.connection_url is null and old.recording_url is null) then
      raise exception 'hearing_not_deletable'
        using hint = 'Solo se elimina una audiencia programada, futura, sin enlace de conexión ni grabación.';
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' then
    new.created_at := now();
    new.updated_at := null;
    new.updated_by := null;
    if v_user is null then
      return new;
    end if;
    new.created_by := v_user;
    new.status_id := 1;
    v_error := public.hearing_schedule_error(new.scheduled_at);
    if v_error is not null then
      raise exception '%', v_error;
    end if;
    if not exists (select 1 from public.hearing_types t where t.id = new.hearing_type_id and t.is_active) then
      raise exception 'hearing_type_inactive';
    end if;
    if new.recording_url is not null then
      raise exception 'hearing_recording_only_realizada';
    end if;
    return new;
  end if;

  -- UPDATE
  -- Solo cambió la marca de expediente (hearings_filed_rules ya la validó): no es un cambio de la
  -- audiencia, así que no toca updated_at / updated_by.
  if (to_jsonb(new) - array['filed_at', 'filed_by', 'filed_by_name'])
     = (to_jsonb(old) - array['filed_at', 'filed_by', 'filed_by_name']) then
    return new;
  end if;

  new.created_at := old.created_at;
  new.created_by := old.created_by;
  new.updated_at := now();
  new.updated_by := coalesce(v_user, old.updated_by);
  if v_user is null then
    return new;
  end if;

  -- Cerrada: solo se corrige la grabación de una Realizada.
  if old.status_id <> 1 then
    if (new.scheduled_at, new.hearing_type_id, new.case_number, new.court_id, new.connection_url, new.status_id, new.notes)
       is distinct from
       (old.scheduled_at, old.hearing_type_id, old.case_number, old.court_id, old.connection_url, old.status_id, old.notes)
       or (old.status_id <> 2 and new.recording_url is distinct from old.recording_url) then
      raise exception 'hearing_closed';
    end if;
    if old.status_id = 2 and new.recording_url is null then
      raise exception 'hearing_recording_required';
    end if;
    return new;
  end if;

  if new.status_id = 1 then
    if new.scheduled_at is distinct from old.scheduled_at then
      v_error := public.hearing_schedule_error(new.scheduled_at);
      if v_error is not null then
        raise exception '%', v_error;
      end if;
    end if;
    if new.hearing_type_id is distinct from old.hearing_type_id
       and not exists (select 1 from public.hearing_types t where t.id = new.hearing_type_id and t.is_active) then
      raise exception 'hearing_type_inactive';
    end if;
    if new.recording_url is not null then
      raise exception 'hearing_recording_only_realizada';
    end if;
    return new;
  end if;

  -- Cierre: la fecha y los datos del proceso no cambian al cerrar.
  if (new.scheduled_at, new.hearing_type_id, new.case_number, new.court_id)
     is distinct from (old.scheduled_at, old.hearing_type_id, old.case_number, old.court_id) then
    raise exception 'hearing_close_with_changes';
  end if;

  if new.status_id = 2 then
    if now() < old.scheduled_at + interval '1 hour' then
      raise exception 'hearing_too_early_to_close';
    end if;
    if new.recording_url is null then
      raise exception 'hearing_recording_required';
    end if;
  elsif new.status_id = 3 then
    if now() < old.scheduled_at then
      raise exception 'hearing_too_early_to_cancel';
    end if;
    if new.recording_url is not null then
      raise exception 'hearing_recording_only_realizada';
    end if;
  end if;
  return new;
end;
$$;
