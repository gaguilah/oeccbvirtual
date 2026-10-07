-- Correos de PQRS, fase 1 (docs/plan-correos-resend.md).
--
-- 1. Número de radicado legible para el ciudadano: PQRS-<año>-<6 dígitos>, consecutivo por año
--    (hora de Colombia). Lo genera la base de datos al insertar; nadie lo envía ni lo cambia.
-- 2. email_log: registro de cada correo enviado o fallido (para saber qué se envió, reintentar y
--    no enviar dos veces). Solo lo escriben y leen las Edge Functions (service role).

-- ---------------------------------------------------------------------------------------------
-- Consecutivo por año. La fila del año se bloquea en el upsert, así dos PQRS simultáneas nunca
-- reciben el mismo número.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.request_counters (
  year smallint primary key,
  last_value integer not null check (last_value >= 0)
);

alter table public.request_counters enable row level security;
revoke all on table public.request_counters from anon, authenticated;

alter table public.customer_requests add column if not exists request_number text;

create or replace function public.customer_requests_assign_number()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_year smallint := extract(year from (coalesce(new.created_at, now()) at time zone 'America/Bogota'));
  v_value integer;
begin
  if new.request_number is not null then
    return new;
  end if;

  insert into public.request_counters (year, last_value) values (v_year, 1)
  on conflict (year) do update set last_value = public.request_counters.last_value + 1
  returning last_value into v_value;

  new.request_number := format('PQRS-%s-%s', v_year, lpad(v_value::text, 6, '0'));
  return new;
end;
$$;

revoke execute on function public.customer_requests_assign_number() from public, anon, authenticated;

drop trigger if exists customer_requests_assign_number on public.customer_requests;
create trigger customer_requests_assign_number
  before insert on public.customer_requests
  for each row execute function public.customer_requests_assign_number();

-- PQRS ya existentes: numeradas por orden de llegada dentro de cada año, y el consecutivo queda
-- en el último número usado.
with numbered as (
  select
    id,
    extract(year from (created_at at time zone 'America/Bogota'))::smallint as year,
    row_number() over (
      partition by extract(year from (created_at at time zone 'America/Bogota'))
      order by created_at, id
    ) as n
  from public.customer_requests
  where request_number is null
)
update public.customer_requests c
   set request_number = format('PQRS-%s-%s', numbered.year, lpad(numbered.n::text, 6, '0'))
  from numbered
 where c.id = numbered.id;

insert into public.request_counters (year, last_value)
select
  split_part(request_number, '-', 2)::smallint,
  max(split_part(request_number, '-', 3)::integer)
from public.customer_requests
group by 1
on conflict (year) do update set last_value = greatest(public.request_counters.last_value, excluded.last_value);

alter table public.customer_requests alter column request_number set not null;
alter table public.customer_requests drop constraint if exists customer_requests_request_number_key;
alter table public.customer_requests add constraint customer_requests_request_number_key unique (request_number);

-- ---------------------------------------------------------------------------------------------
-- Registro de correos.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  -- Qué correo es: 'pqrs_acuse', 'pqrs_aviso_oficina' (después: 'pqrs_respuesta', audiencias…).
  kind text not null,
  recipient text not null,
  subject text not null,
  status text not null check (status in ('sent', 'failed')),
  -- Id que devuelve Resend (para buscarlo en su panel) o el error.
  provider_id text,
  error text,
  -- Registro que originó el correo, p. ej. ('customer_requests', <id de la PQRS>).
  reference_table text,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists email_log_reference_idx on public.email_log (reference_table, reference_id);
create index if not exists email_log_created_at_idx on public.email_log (created_at desc);

-- RLS sin políticas: ni el navegador ni los usuarios del dashboard lo leen ni escriben.
alter table public.email_log enable row level security;
revoke all on table public.email_log from anon, authenticated;
