-- Audiencias, fase 2: lectura pública para /audiencias (docs/plan-audiencias.md).
--
-- La tabla hearings no se abre al público (sus políticas exigen audiencias.ver). Esta función
-- security definer devuelve solo las columnas publicables y nunca las observaciones (notes), desde
-- 3 meses atrás (hora de Colombia) hasta todas las futuras, con filtros y paginación.
--   p_period: 'proximas' (desde hoy, de la más cercana a la más lejana) o 'anteriores' (antes de
--   hoy, de la más reciente a la más antigua).
-- total_count repite en cada fila el total de resultados (para la paginación).

create or replace function public.list_public_hearings(
  p_period text default 'proximas',
  p_court smallint default null,
  p_type smallint default null,
  p_from date default null,
  p_to date default null,
  p_query text default null,
  p_limit integer default 10,
  p_offset integer default 0
)
returns table (
  id uuid,
  scheduled_at timestamptz,
  type_name text,
  requires_link boolean,
  case_number text,
  court_id smallint,
  status_id smallint,
  connection_url text,
  recording_url text,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with bounds as (
    select
      ((now() at time zone 'America/Bogota')::date)::timestamp at time zone 'America/Bogota' as today_start,
      (((now() at time zone 'America/Bogota')::date - interval '3 months')::date)::timestamp at time zone 'America/Bogota' as window_start
  ),
  filtered as (
    select h.id, h.scheduled_at, t.description, t.requires_link, h.case_number, h.court_id, h.status_id,
           h.connection_url, h.recording_url
    from public.hearings h
    join public.hearing_types t on t.id = h.hearing_type_id
    cross join bounds b
    where h.scheduled_at >= b.window_start
      and case when p_period = 'anteriores' then h.scheduled_at < b.today_start else h.scheduled_at >= b.today_start end
      and (p_court is null or h.court_id = p_court)
      and (p_type is null or h.hearing_type_id = p_type)
      and (p_from is null or h.scheduled_at >= p_from::timestamp at time zone 'America/Bogota')
      and (p_to is null or h.scheduled_at < (p_to + 1)::timestamp at time zone 'America/Bogota')
      and (coalesce(p_query, '') = '' or h.case_number like '%' || regexp_replace(p_query, '\D', '', 'g') || '%')
  )
  select f.id, f.scheduled_at, f.description, f.requires_link, f.case_number, f.court_id, f.status_id,
         f.connection_url, f.recording_url, count(*) over ()
  from filtered f
  order by
    case when p_period = 'anteriores' then null else f.scheduled_at end asc,
    case when p_period = 'anteriores' then f.scheduled_at end desc,
    f.case_number
  limit least(greatest(coalesce(p_limit, 10), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke execute on function public.list_public_hearings(text, smallint, smallint, date, date, text, integer, integer) from public;
grant execute on function public.list_public_hearings(text, smallint, smallint, date, date, text, integer, integer) to anon, authenticated;
