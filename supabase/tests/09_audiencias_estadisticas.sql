-- Estadísticas de audiencias (docs/plan-audiencias-estadisticas.md, migración
-- 20261105120000_hearing_stats.sql). src/dashboard/audiencias/estadisticas/stats.ts suma estos
-- conteos para las tarjetas: si cambia lo que devuelve hearing_stats, cambiar los dos.
--
-- Las audiencias se crean como postgres (sin usuario, hearings_rules no actúa), así pueden estar en
-- marzo de 2020 y en cualquier estado. Marzo de 2020 se cuenta en hora de Colombia: el 31 a las
-- 11:30 p. m. entra (en UTC ya es 1 de abril) y el 1 de abril a las 00:00 no.
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

select tests.create_role('prueba_estadisticas_juzgado', 'court', array['audiencias.ver']);
select tests.create_role('prueba_estadisticas_todos', 'all', array['audiencias.ver']);
select tests.create_role('prueba_estadisticas_sin', 'all', array['remates.ver']);
select tests.create_user('estadisticasuno@prueba.test', 'prueba_estadisticas_juzgado', 1::smallint);
select tests.create_user('estadisticastodos@prueba.test', 'prueba_estadisticas_todos');
select tests.create_user('estadisticassin@prueba.test', 'prueba_estadisticas_sin');

insert into public.hearing_types (description, requires_link) values
  ('Tipo virtual de estadísticas', true),
  ('Tipo presencial de estadísticas', false);

insert into public.hearings (scheduled_at, hearing_type_id, case_number, court_id, status_id) values
  ('2020-03-02T09:00:00-05:00', (select id from public.hearing_types where description = 'Tipo virtual de estadísticas'),
   '68001310300120200000901', 1, 2),
  ('2020-03-03T09:00:00-05:00', (select id from public.hearing_types where description = 'Tipo virtual de estadísticas'),
   '68001310300120200000902', 1, 3),
  ('2020-03-04T09:00:00-05:00', (select id from public.hearing_types where description = 'Tipo presencial de estadísticas'),
   '68001310300120200000903', 1, 1),
  ('2020-03-31T23:30:00-05:00', (select id from public.hearing_types where description = 'Tipo virtual de estadísticas'),
   '68001310300120200000904', 1, 2),
  ('2020-04-01T00:00:00-05:00', (select id from public.hearing_types where description = 'Tipo virtual de estadísticas'),
   '68001310300120200000905', 1, 2),
  ('2020-03-05T09:00:00-05:00', (select id from public.hearing_types where description = 'Tipo presencial de estadísticas'),
   '68001310300220200000906', 2, 2),
  ('2030-06-03T09:00:00-05:00', (select id from public.hearing_types where description = 'Tipo virtual de estadísticas'),
   '68001310300120300000907', 1, 1);

-- Fila de un tipo en el resultado.
create function pg_temp.type_row(p_stats jsonb, p_description text) returns jsonb
language sql immutable as $$
  select r from jsonb_array_elements(p_stats -> 'rows') r where r ->> 'description' = p_description
$$;
-- Total de todas las filas.
create function pg_temp.total(p_stats jsonb) returns int
language sql immutable as $$
  select coalesce(sum((r ->> 'total')::int), 0)::int from jsonb_array_elements(p_stats -> 'rows') r
$$;

-- Alcance de los dos juzgados ------------------------------------------------------------------------
select tests.login_as('estadisticastodos@prueba.test');
select is(pg_temp.total(public.hearing_stats('2020-03-01', '2020-03-31')), 5,
  'cuenta las audiencias de marzo en hora de Colombia (entra el 31 a las 11:30 p. m., no el 1 de abril)');
select is(pg_temp.type_row(public.hearing_stats('2020-03-01', '2020-03-31'), 'Tipo virtual de estadísticas'),
  jsonb_build_object('type_id', (select id from public.hearing_types where description = 'Tipo virtual de estadísticas'),
    'description', 'Tipo virtual de estadísticas', 'requires_link', true,
    'total', 3, 'realizadas', 2, 'canceladas', 1, 'programadas', 0, 'por_cerrar', 0),
  'separa los estados por tipo');
select is((pg_temp.type_row(public.hearing_stats('2020-03-01', '2020-03-31'), 'Tipo presencial de estadísticas') ->> 'programadas')::int, 1,
  'programadas: las que siguen en estado Programada');
select is((pg_temp.type_row(public.hearing_stats('2020-03-01', '2020-03-31'), 'Tipo presencial de estadísticas') ->> 'por_cerrar')::int, 1,
  'por cerrar: una Programada cuya hora ya llegó');
select is((pg_temp.type_row(public.hearing_stats('2030-06-01', '2030-06-30'), 'Tipo virtual de estadísticas') ->> 'por_cerrar')::int, 0,
  'una Programada futura no está por cerrar');
select is((public.hearing_stats('2020-03-01', '2020-03-31') -> 'rows' -> 0 ->> 'description'),
  'Tipo virtual de estadísticas', 'ordena los tipos de más a menos audiencias');
select is(pg_temp.total(public.hearing_stats('2020-03-01', '2020-03-31', 2::smallint)), 1, 'filtra por juzgado');
select is(pg_temp.total(public.hearing_stats('2020-03-01', '2020-03-31', null,
  (select id from public.hearing_types where description = 'Tipo presencial de estadísticas'))), 2, 'filtra por tipo');
select is(pg_temp.total(public.hearing_stats('2020-03-01', '2020-03-31', null, null, true)), 3,
  'modalidad virtual: tipos que requieren enlace');
select is(pg_temp.total(public.hearing_stats('2020-03-01', '2020-03-31', null, null, false)), 2,
  'modalidad presencial: tipos que no requieren enlace');
select is(pg_temp.total(public.hearing_stats('2020-05-01', '2020-05-31')), 0, 'un periodo sin audiencias da 0');
select is(public.hearing_stats('2020-05-01', '2020-05-31') -> 'rows', '[]'::jsonb, 'sin audiencias, la lista está vacía');
select is((public.hearing_stats('2020-03-01', '2020-03-31') ->> 'first_year')::int, 2020, 'año de la primera audiencia');
select is((public.hearing_stats('2020-03-01', '2020-03-31') ->> 'last_year')::int, 2030, 'año de la última audiencia');
select throws_ok($$ select public.hearing_stats('2020-03-31', '2020-03-01') $$, 'P0001', 'invalid_period',
  'rechaza un periodo al revés');

-- Alcance de un juzgado ------------------------------------------------------------------------------
select tests.login_as('estadisticasuno@prueba.test');
select is(pg_temp.total(public.hearing_stats('2020-03-01', '2020-03-31')), 4, 'un usuario de juzgado solo cuenta el suyo');
select is(pg_temp.total(public.hearing_stats('2020-03-01', '2020-03-31', 2::smallint)), 0,
  'aunque pida el otro juzgado');

-- Sin permiso ----------------------------------------------------------------------------------------
select tests.login_as('estadisticassin@prueba.test');
select throws_ok($$ select public.hearing_stats('2020-03-01', '2020-03-31') $$, '42501', 'forbidden',
  'sin audiencias.ver no hay estadísticas');

select * from finish();
rollback;
