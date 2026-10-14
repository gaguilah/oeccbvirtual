-- Audiencias públicas: Próximas / Anteriores por hora, no por día
-- (docs/plan-audiencias-publica-tiempos.md).
--
-- Una audiencia pasa a 'anteriores' cuando ya está cerrada (Realizada o Cancelada) o cuando pasaron
-- 60 minutos desde su hora, lo primero que ocurra; la hora es la del servidor. pending_confirmation
-- marca las que siguen Programada después de esos 60 minutos (el sitio las muestra "Por confirmar").
-- El margen es el mismo de Avisos de Remate (REALIZADO_DESPUES_DE_MIN en
-- src/components/remates/constants.ts): si cambia uno, cambiar el otro.
--
-- Lo demás no cambia: solo columnas publicables (nunca notes), ventana de 3 meses hacia atrás desde
-- el día (hora de Colombia), filtros, orden, desempate por radicado, máximo 50 por página y
-- total_count en cada fila. Cambia lo que devuelve, así que se borra y se vuelve a crear.

drop function if exists public.list_public_hearings(text, smallint, smallint, date, date, text, integer, integer);

create function public.list_public_hearings(
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
  pending_confirmation boolean,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with bounds as (
    select
      now() - interval '60 minutes' as cutoff,
      (((now() at time zone 'America/Bogota')::date - interval '3 months')::date)::timestamp at time zone 'America/Bogota' as window_start
  ),
  filtered as (
    select h.id, h.scheduled_at, t.description, t.requires_link, h.case_number, h.court_id, h.status_id,
           h.connection_url, h.recording_url,
           (h.status_id = 1 and h.scheduled_at <= b.cutoff) as pending_confirmation,
           (h.status_id <> 1 or h.scheduled_at <= b.cutoff) as is_past
    from public.hearings h
    join public.hearing_types t on t.id = h.hearing_type_id
    cross join bounds b
    where h.scheduled_at >= b.window_start
      and (p_court is null or h.court_id = p_court)
      and (p_type is null or h.hearing_type_id = p_type)
      and (p_from is null or h.scheduled_at >= p_from::timestamp at time zone 'America/Bogota')
      and (p_to is null or h.scheduled_at < (p_to + 1)::timestamp at time zone 'America/Bogota')
      and (coalesce(p_query, '') = '' or h.case_number like '%' || regexp_replace(p_query, '\D', '', 'g') || '%')
  )
  select f.id, f.scheduled_at, f.description, f.requires_link, f.case_number, f.court_id, f.status_id,
         f.connection_url, f.recording_url, f.pending_confirmation, count(*) over ()
  from filtered f
  where f.is_past = (p_period = 'anteriores')
  order by
    case when p_period = 'anteriores' then null else f.scheduled_at end asc,
    case when p_period = 'anteriores' then f.scheduled_at end desc,
    f.case_number
  limit least(greatest(coalesce(p_limit, 10), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke execute on function public.list_public_hearings(text, smallint, smallint, date, date, text, integer, integer) from public;
grant execute on function public.list_public_hearings(text, smallint, smallint, date, date, text, integer, integer) to anon, authenticated;
