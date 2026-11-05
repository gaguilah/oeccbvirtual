-- Estadísticas de audiencias (docs/plan-audiencias-estadisticas.md).
--
-- hearing_stats() cuenta las audiencias del periodo por tipo y estado, para la página
-- /dashboard/audiencias/estadisticas. Es security invoker: cuenta sobre hearings con el RLS de quien
-- la llama (hearings_select: audiencias.ver en el juzgado de cada fila), así un usuario de juzgado
-- solo suma el suyo aunque pida el otro. No crea tablas ni permisos.
--
-- - Periodo: p_from y p_to son días de Colombia, ambos inclusive, sobre scheduled_at (la fecha de
--   realización, no la de creación).
-- - p_court, p_type: null = todos. p_virtual: modalidad según el tipo (hearing_types.requires_link,
--   lo mismo que "Modalidad" en el sitio público); null = todas.
-- - programadas: las que siguen en estado Programada; por_cerrar: de ellas, las que ya llegaron a su
--   hora (scheduled_at <= now(), la misma regla de la pestaña Por cerrar del dashboard).
-- - first_year / last_year: años (Colombia) de la primera y la última audiencia que el usuario puede
--   ver, sin filtros, para armar la lista de años del filtro de periodo.

create or replace function public.hearing_stats(
  p_from date,
  p_to date,
  p_court smallint default null,
  p_type smallint default null,
  p_virtual boolean default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_from timestamptz;
  v_to timestamptz;
begin
  if not public.has_permission('audiencias.ver') then
    raise exception 'forbidden' using errcode = '42501', hint = 'Requiere el permiso audiencias.ver.';
  end if;
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'invalid_period' using hint = 'El periodo no es válido.';
  end if;

  v_from := p_from::timestamp at time zone 'America/Bogota';
  v_to := (p_to + 1)::timestamp at time zone 'America/Bogota';

  return jsonb_build_object(
    'rows', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.total desc, s.description)
      from (
        select
          t.id as type_id,
          t.description,
          t.requires_link,
          count(*) as total,
          count(*) filter (where h.status_id = 2) as realizadas,
          count(*) filter (where h.status_id = 3) as canceladas,
          count(*) filter (where h.status_id = 1) as programadas,
          count(*) filter (where h.status_id = 1 and h.scheduled_at <= now()) as por_cerrar
        from public.hearings h
        join public.hearing_types t on t.id = h.hearing_type_id
        where h.scheduled_at >= v_from
          and h.scheduled_at < v_to
          and (p_court is null or h.court_id = p_court)
          and (p_type is null or h.hearing_type_id = p_type)
          and (p_virtual is null or t.requires_link = p_virtual)
        group by t.id, t.description, t.requires_link
      ) s
    ), '[]'::jsonb),
    'first_year', (
      select extract(year from min(h.scheduled_at) at time zone 'America/Bogota')::int from public.hearings h
    ),
    'last_year', (
      select extract(year from max(h.scheduled_at) at time zone 'America/Bogota')::int from public.hearings h
    )
  );
end;
$$;

revoke execute on function public.hearing_stats(date, date, smallint, smallint, boolean) from public, anon;
grant execute on function public.hearing_stats(date, date, smallint, smallint, boolean) to authenticated;
