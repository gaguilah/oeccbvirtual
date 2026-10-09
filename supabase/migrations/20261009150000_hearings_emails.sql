-- Audiencias, fase 4: correos (docs/plan-audiencias.md).
--
-- La Edge Function hearings-mailer (sin JWT, protegida con HEARINGS_CRON_SECRET) la llaman tareas
-- de pg_cron (ver docs/plan-audiencias.md, "Puesta en marcha de los correos"):
--   weekly  cada día hábil a las 7:30 a. m.: si es el primer día hábil de la semana y el listado
--           de esa semana no ha salido, lo envía (hearing_weekly_sends evita repetirlo).
--   tick    cada 5 minutos: recordatorios (15 minutos antes) y avisos de cambio en cola.
-- Solo se comunica una audiencia Programada cuyo tipo no requiere enlace o que ya lo tiene.
-- Destinatarios: usuarios activos con audiencias.ver en el juzgado (incluido el superadmin) y el
-- buzón institucional del juzgado (execution_courts.email), si está registrado.

alter table public.hearings add column if not exists reminder_sent_at timestamptz;

-- Buzón institucional de cada juzgado: recibe los mismos correos que sus usuarios.
alter table public.execution_courts add column if not exists email text;
alter table public.execution_courts drop constraint if exists execution_courts_email_chk;
alter table public.execution_courts add constraint execution_courts_email_chk
  check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

update public.execution_courts set email = 'j01eccbuc@cendoj.ramajudicial.gov.co' where id = 1;
update public.execution_courts set email = 'j02eccbuc@cendoj.ramajudicial.gov.co' where id = 2;

-- Reprogramar (otra fecha u hora) permite un recordatorio nuevo.
create or replace function public.hearings_reset_reminder()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.scheduled_at is distinct from old.scheduled_at then
    new.reminder_sent_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists hearings_reset_reminder on public.hearings;
create trigger hearings_reset_reminder
  before update on public.hearings
  for each row execute function public.hearings_reset_reminder();

revoke execute on function public.hearings_reset_reminder() from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Listado semanal enviado (una fila por semana: lunes de la semana).
-- ---------------------------------------------------------------------------------------------
create table if not exists public.hearing_weekly_sends (
  week_start date primary key,
  sent_at timestamptz not null default now(),
  recipients integer not null default 0,
  hearings integer not null default 0
);
alter table public.hearing_weekly_sends enable row level security;
revoke all on table public.hearing_weekly_sends from anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Cola de avisos de cambio: solo cambios de audiencias de la semana en curso cuyo listado ya
-- salió (antes de eso, el listado del lunes ya los incluye).
--   nueva     entra al listado de la semana (creada, movida a esta semana o se le agregó el enlace)
--   cambio    cambió la fecha, la hora, el tipo, el radicado, el juzgado o el enlace
--   retirada  sale del listado (eliminada o movida a otra semana)
-- ---------------------------------------------------------------------------------------------
create table if not exists public.hearing_notifications (
  id uuid primary key default gen_random_uuid(),
  hearing_id uuid,
  kind text not null constraint hearing_notifications_kind_chk check (kind in ('nueva', 'cambio', 'retirada')),
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists hearing_notifications_pending_idx on public.hearing_notifications (created_at) where sent_at is null;
alter table public.hearing_notifications enable row level security;
revoke all on table public.hearing_notifications from anon, authenticated;

-- Datos de una audiencia para el correo (con el nombre del tipo).
create or replace function public.hearing_snapshot(p_hearing public.hearings)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'scheduled_at', p_hearing.scheduled_at,
    'type', t.description,
    'requires_link', t.requires_link,
    'case_number', p_hearing.case_number,
    'court_id', p_hearing.court_id,
    'connection_url', p_hearing.connection_url
  )
  from public.hearing_types t where t.id = p_hearing.hearing_type_id;
$$;

-- ¿Va en el listado de la semana en curso? Programada, futura, de esta semana (lunes a viernes,
-- hora de Colombia) y comunicable (tipo sin enlace obligatorio o con enlace).
create or replace function public.hearing_in_current_list(p_hearing public.hearings)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_hearing.status_id = 1
     and p_hearing.scheduled_at > now()
     and (p_hearing.scheduled_at at time zone 'America/Bogota')::date
         between date_trunc('week', now() at time zone 'America/Bogota')::date
             and date_trunc('week', now() at time zone 'America/Bogota')::date + 4
     and exists (
       select 1 from public.hearing_types t
       where t.id = p_hearing.hearing_type_id and (not t.requires_link or p_hearing.connection_url is not null)
     );
$$;

create or replace function public.hearings_enqueue_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before boolean := false;
  v_after boolean := false;
begin
  -- Sin listado de esta semana todavía: el del lunes ya lo incluirá.
  if not exists (
    select 1 from public.hearing_weekly_sends
    where week_start = date_trunc('week', now() at time zone 'America/Bogota')::date
  ) then
    return null;
  end if;

  if tg_op <> 'INSERT' then v_before := public.hearing_in_current_list(old); end if;
  if tg_op <> 'DELETE' then v_after := public.hearing_in_current_list(new); end if;

  if not v_before and v_after then
    insert into public.hearing_notifications (hearing_id, kind, after)
    values (new.id, 'nueva', public.hearing_snapshot(new));
  elsif v_before and not v_after then
    -- Sale del listado: eliminada o movida a otra semana. Si solo se cerró (realizada o cancelada
    -- a su hora), no se avisa.
    if tg_op = 'DELETE' or (new.status_id = 1 and new.scheduled_at is distinct from old.scheduled_at) then
      insert into public.hearing_notifications (hearing_id, kind, before, after)
      values (
        old.id, 'retirada', public.hearing_snapshot(old),
        case when tg_op = 'DELETE' then null else public.hearing_snapshot(new) end
      );
    end if;
  elsif v_before and v_after
    and (new.scheduled_at, new.hearing_type_id, new.case_number, new.court_id, new.connection_url)
        is distinct from (old.scheduled_at, old.hearing_type_id, old.case_number, old.court_id, old.connection_url) then
    insert into public.hearing_notifications (hearing_id, kind, before, after)
    values (new.id, 'cambio', public.hearing_snapshot(old), public.hearing_snapshot(new));
  end if;
  return null;
end;
$$;

drop trigger if exists hearings_enqueue_change on public.hearings;
create trigger hearings_enqueue_change
  after insert or update or delete on public.hearings
  for each row execute function public.hearings_enqueue_change();

-- ---------------------------------------------------------------------------------------------
-- Destinatarios: usuarios activos con audiencias.ver en ese juzgado (misma lógica que
-- has_permission; el superadmin los recibe todos; correo de la cuenta de Auth) y el buzón del
-- juzgado. Sin repetidos.
-- ---------------------------------------------------------------------------------------------
create or replace function public.hearing_recipients(p_court smallint)
returns table (email text, name text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct on (lower(x.email)) x.email, x.name
  from (
  select u.email::text as email, coalesce(p.full_name, u.email::text) as name
  from public.profiles p
  join public.roles r on r.id = p.role_id
  join auth.users u on u.id = p.id
  where p.active
    and u.email is not null
    and (
      r.code = 'superadmin'
      or (
        exists (select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_code = 'audiencias.ver')
        and (r.scope = 'all' or p.court = p_court)
      )
    )
  union all
  select c.email, c.name from public.execution_courts c where c.id = p_court and c.email is not null
  ) x
  order by lower(x.email);
$$;

revoke execute on function public.hearing_snapshot(public.hearings) from public, anon, authenticated;
revoke execute on function public.hearing_in_current_list(public.hearings) from public, anon, authenticated;
revoke execute on function public.hearings_enqueue_change() from public, anon, authenticated;
revoke execute on function public.hearing_recipients(smallint) from public, anon, authenticated;
grant execute on function public.hearing_recipients(smallint) to service_role;
grant execute on function public.hearing_in_current_list(public.hearings) to service_role;
grant execute on function public.hearing_snapshot(public.hearings) to service_role;
