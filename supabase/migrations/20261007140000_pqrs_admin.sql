-- Gestión de PQRS en el dashboard (docs/plan-pqrs-dashboard.md).
--
-- Las PQRS son de la oficina (no de un juzgado): los permisos se revisan sin court.
--   pqrs.ver        ver la lista, el detalle y el historial de correos
--   pqrs.gestionar  cambiar el estado (en trámite, cerrada con motivo)
--   pqrs.responder  enviar la respuesta (Edge Function respond-request)
-- El navegador nunca escribe en customer_requests: el estado se cambia con set_request_status y la
-- respuesta la guarda la Edge Function con la service role key.

-- ---------------------------------------------------------------------------------------------
-- Estado: de número (0 = recibida) a texto.
-- ---------------------------------------------------------------------------------------------
alter table public.customer_requests alter column status drop default;

-- Restricciones viejas sobre status (creadas desde el panel, p. ej. status in (0, 1, 2)): al pasar a
-- texto comparan texto con número y el cambio de tipo falla. Se borran; abajo se crea la nueva.
do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.customer_requests'::regclass
      and contype = 'c'
      and conname <> 'customer_requests_type_chk'
      and pg_get_constraintdef(oid) ~* '\mstatus\M'
  loop
    execute format('alter table public.customer_requests drop constraint %I', r.conname);
  end loop;
end;
$$;

alter table public.customer_requests
  alter column status type text using (
    case status::text
      when '1' then 'en_tramite'
      when '2' then 'respondida'
      when '3' then 'cerrada'
      when 'en_tramite' then 'en_tramite'
      when 'respondida' then 'respondida'
      when 'cerrada' then 'cerrada'
      else 'recibida'
    end
  );
alter table public.customer_requests alter column status set default 'recibida';

alter table public.customer_requests add column if not exists responded_at timestamptz;
alter table public.customer_requests add column if not exists responded_by uuid references auth.users (id) on delete set null;
alter table public.customer_requests add column if not exists closed_reason text;
alter table public.customer_requests add column if not exists closed_at timestamptz;
alter table public.customer_requests add column if not exists updated_by uuid references auth.users (id) on delete set null;

alter table public.customer_requests drop constraint if exists customer_requests_status_chk;
alter table public.customer_requests add constraint customer_requests_status_chk check (
  status in ('recibida', 'en_tramite', 'respondida', 'cerrada')
  and (status <> 'respondida' or (response is not null and responded_at is not null))
  and (status <> 'cerrada' or closed_reason is not null)
);

create index if not exists customer_requests_status_created_idx on public.customer_requests (status, created_at);

-- ---------------------------------------------------------------------------------------------
-- Plazo: 15 días hábiles (lunes a viernes) contados desde el día siguiente a la radicación, en hora
-- de Colombia. Festivos: más adelante. La misma regla está en src/dashboard/pqrs/deadline.ts.
-- ---------------------------------------------------------------------------------------------
create or replace function public.pqrs_due_date(p_created_at timestamptz)
returns date
language sql
stable
set search_path = ''
as $$
  select d::date
  from generate_series(
    (p_created_at at time zone 'America/Bogota')::date + 1,
    (p_created_at at time zone 'America/Bogota')::date + 40,
    interval '1 day'
  ) as d
  where extract(isodow from d) < 6
  order by d
  offset 14 limit 1;
$$;

-- ---------------------------------------------------------------------------------------------
-- Lectura: solo con pqrs.ver. Sin escritura desde el navegador.
-- ---------------------------------------------------------------------------------------------
revoke all on table public.customer_requests from anon, authenticated;
grant select on table public.customer_requests to authenticated;

drop policy if exists customer_requests_select on public.customer_requests;
create policy customer_requests_select on public.customer_requests
  for select to authenticated
  using ((select public.has_permission('pqrs.ver')));

-- ---------------------------------------------------------------------------------------------
-- Cambiar el estado (pqrs.gestionar). Una respondida no cambia; cerrar exige motivo; una cerrada
-- se puede reabrir (vuelve a en trámite).
-- ---------------------------------------------------------------------------------------------
create or replace function public.set_request_status(p_id uuid, p_status text, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current text;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
  if not public.has_permission('pqrs.gestionar') then
    raise exception 'forbidden' using errcode = '42501', hint = 'Requiere el permiso pqrs.gestionar.';
  end if;

  select status into v_current from public.customer_requests where id = p_id for update;
  if v_current is null then
    raise exception 'request_not_found' using hint = 'La PQRS no existe.';
  end if;
  if v_current = 'respondida' then
    raise exception 'request_answered' using hint = 'Una PQRS respondida no cambia de estado.';
  end if;
  if p_status not in ('recibida', 'en_tramite', 'cerrada') then
    raise exception 'invalid_status' using hint = 'Estado no válido.';
  end if;
  if p_status = 'cerrada' and (v_reason is null or char_length(v_reason) < 5 or char_length(v_reason) > 500) then
    raise exception 'reason_required' using hint = 'El motivo de cierre debe tener entre 5 y 500 caracteres.';
  end if;

  update public.customer_requests
     set status = p_status,
         closed_reason = case when p_status = 'cerrada' then v_reason else null end,
         closed_at = case when p_status = 'cerrada' then now() else null end,
         updated_at = now(),
         updated_by = (select auth.uid())
   where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Historial de correos de una PQRS (pqrs.ver) y nombres de quien respondió y quien la modificó.
-- security definer: email_log y los perfiles ajenos no se leen desde el navegador.
-- ---------------------------------------------------------------------------------------------
create or replace function public.request_emails(p_id uuid)
returns table (kind text, recipient text, status text, error text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_permission('pqrs.ver') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select e.kind, e.recipient, e.status, e.error, e.created_at
    from public.email_log e
    where e.reference_table = 'customer_requests' and e.reference_id = p_id
    order by e.created_at;
end;
$$;

create or replace function public.request_audit(p_id uuid)
returns table (responded_by_name text, updated_by_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_permission('pqrs.ver') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select
      coalesce(nullif(trim(rp.full_name), ''), ru.email::text),
      coalesce(nullif(trim(up.full_name), ''), uu.email::text)
    from public.customer_requests c
    left join public.profiles rp on rp.id = c.responded_by
    left join auth.users ru on ru.id = c.responded_by
    left join public.profiles up on up.id = c.updated_by
    left join auth.users uu on uu.id = c.updated_by
    where c.id = p_id;
end;
$$;

-- Resumen para la tarjeta de Inicio: pendientes y vencidas (pqrs.ver).
create or replace function public.pqrs_summary()
returns table (pending bigint, overdue bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_permission('pqrs.ver') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select
      count(*),
      count(*) filter (where public.pqrs_due_date(created_at) < (now() at time zone 'America/Bogota')::date)
    from public.customer_requests
    where status in ('recibida', 'en_tramite');
end;
$$;

revoke execute on function public.set_request_status(uuid, text, text) from public, anon;
revoke execute on function public.request_emails(uuid) from public, anon;
revoke execute on function public.request_audit(uuid) from public, anon;
revoke execute on function public.pqrs_summary() from public, anon;
grant execute on function public.set_request_status(uuid, text, text) to authenticated;
grant execute on function public.request_emails(uuid) to authenticated;
grant execute on function public.request_audit(uuid) to authenticated;
grant execute on function public.pqrs_summary() to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Permisos, rol "Director de oficina" y asignación inicial.
-- ---------------------------------------------------------------------------------------------
insert into public.permissions (code, module, name, description) values
  ('pqrs.ver', 'pqrs', 'Ver PQRS', 'Ver la lista, el detalle y el historial de correos de las PQRS.'),
  ('pqrs.gestionar', 'pqrs', 'Gestionar PQRS', 'Marcar PQRS en trámite y cerrarlas con un motivo.'),
  ('pqrs.responder', 'pqrs', 'Responder PQRS', 'Escribir y enviar la respuesta al ciudadano, y reenviarla.')
on conflict (code) do nothing;

insert into public.roles (code, name, description, scope) values
  ('director_oficina', 'Director de oficina', 'Director de la oficina: lo mismo que Oficina y, además, responde las PQRS.', 'all')
on conflict (code) do nothing;

-- El director recibe los permisos que hoy tiene Oficina (p. ej. remates.ver).
insert into public.role_permissions (role_id, permission_code)
select d.id, rp.permission_code
from public.roles d
join public.roles o on o.code = 'oficina'
join public.role_permissions rp on rp.role_id = o.id
where d.code = 'director_oficina'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_code)
select r.id, p.code
from public.roles r
join (values
  ('oficina', 'pqrs.ver'),
  ('oficina', 'pqrs.gestionar'),
  ('director_oficina', 'pqrs.ver'),
  ('director_oficina', 'pqrs.gestionar'),
  ('director_oficina', 'pqrs.responder')
) as p (role_code, code) on p.role_code = r.code
on conflict do nothing;
