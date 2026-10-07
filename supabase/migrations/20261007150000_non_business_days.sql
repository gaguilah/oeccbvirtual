-- Días no hábiles: festivos y cierres que no cuentan en los plazos (docs/plan-dias-no-habiles.md).
--
-- El plazo de las PQRS se calcula solo aquí (antes estaba repetido en el navegador): los días
-- hábiles son de lunes a viernes y no están en non_business_days. Las funciones que leen la tabla
-- son security definer, así que cualquier usuario del dashboard ve el plazo correcto aunque no
-- tenga acceso al calendario. Ver y modificar el calendario: calendario.ver y calendario.gestionar
-- (al inicio solo superadmin; nadie más ve la opción).

create table if not exists public.non_business_days (
  day date primary key
    constraint non_business_days_weekday_chk check (extract(isodow from day) < 6),
  kind text not null
    constraint non_business_days_kind_chk check (kind in ('festivo', 'cierre', 'otro')),
  reason text not null
    constraint non_business_days_reason_chk check (char_length(trim(reason)) between 3 and 120),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.non_business_days enable row level security;
revoke all on table public.non_business_days from anon, authenticated;
grant select on table public.non_business_days to authenticated;
grant insert (day, kind, reason) on table public.non_business_days to authenticated;
grant delete on table public.non_business_days to authenticated;

drop policy if exists non_business_days_select on public.non_business_days;
create policy non_business_days_select on public.non_business_days
  for select to authenticated using ((select public.has_permission('calendario.ver')));

drop policy if exists non_business_days_insert on public.non_business_days;
create policy non_business_days_insert on public.non_business_days
  for insert to authenticated with check ((select public.has_permission('calendario.gestionar')));

drop policy if exists non_business_days_delete on public.non_business_days;
create policy non_business_days_delete on public.non_business_days
  for delete to authenticated using ((select public.has_permission('calendario.gestionar')));

-- ---------------------------------------------------------------------------------------------
-- Días hábiles.
-- ---------------------------------------------------------------------------------------------
create or replace function public.is_business_day(p_day date)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select extract(isodow from p_day) < 6
     and not exists (select 1 from public.non_business_days where day = p_day);
$$;

-- Día hábil número 15 contado desde el día siguiente a la radicación (hora de Colombia).
create or replace function public.pqrs_due_date(p_created_at timestamptz)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select d::date
  from generate_series(
    (p_created_at at time zone 'America/Bogota')::date + 1,
    (p_created_at at time zone 'America/Bogota')::date + 120,
    interval '1 day'
  ) as d
  where extract(isodow from d) < 6
    and not exists (select 1 from public.non_business_days n where n.day = d::date)
  order by d
  offset 14 limit 1;
$$;

-- Días hábiles de p_from (exclusivo) a p_to (inclusivo); negativo si p_to es anterior a p_from.
create or replace function public.business_days_between(p_from date, p_to date)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_to = p_from then 0
    when p_to > p_from then (
      select count(*)::integer
      from generate_series(p_from + 1, p_to, interval '1 day') as d
      where extract(isodow from d) < 6
        and not exists (select 1 from public.non_business_days n where n.day = d::date)
    )
    else -(
      select count(*)::integer
      from generate_series(p_to + 1, p_from, interval '1 day') as d
      where extract(isodow from d) < 6
        and not exists (select 1 from public.non_business_days n where n.day = d::date)
    )
  end;
$$;

-- Columnas calculadas de customer_requests (PostgREST las expone como columnas: select=…,due_date,
-- business_days_left). Positivo: días hábiles que quedan; 0: vence hoy; negativo: vencida.
create or replace function public.due_date(public.customer_requests)
returns date
language sql
stable
set search_path = ''
as $$
  select public.pqrs_due_date($1.created_at);
$$;

create or replace function public.business_days_left(public.customer_requests)
returns integer
language sql
stable
set search_path = ''
as $$
  select public.business_days_between(
    (now() at time zone 'America/Bogota')::date,
    public.pqrs_due_date($1.created_at)
  );
$$;

revoke execute on function public.is_business_day(date) from public, anon;
revoke execute on function public.pqrs_due_date(timestamptz) from public, anon;
revoke execute on function public.business_days_between(date, date) from public, anon;
revoke execute on function public.due_date(public.customer_requests) from public, anon;
revoke execute on function public.business_days_left(public.customer_requests) from public, anon;
grant execute on function public.is_business_day(date) to authenticated;
grant execute on function public.pqrs_due_date(timestamptz) to authenticated;
grant execute on function public.business_days_between(date, date) to authenticated;
grant execute on function public.due_date(public.customer_requests) to authenticated;
grant execute on function public.business_days_left(public.customer_requests) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Permisos (solo superadmin, implícito, al inicio).
-- ---------------------------------------------------------------------------------------------
insert into public.permissions (code, module, name, description) values
  ('calendario.ver', 'calendario', 'Ver días no hábiles', 'Ver la opción "Días no hábiles" del menú y su pantalla.'),
  ('calendario.gestionar', 'calendario', 'Gestionar días no hábiles', 'Agregar, cargar el calendario de un año y eliminar días no hábiles.')
on conflict (code) do nothing;
