-- Días no hábiles (docs/plan-dias-no-habiles.md, migración 20261007150000_non_business_days.sql).
-- Las funciones de plazos (is_business_day, pqrs_due_date, business_days_between) se prueban en
-- 05_pqrs.sql.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select tests.create_role('prueba_calendario_ver', 'all', array['calendario.ver']);
select tests.create_role('prueba_calendario_gestion', 'all', array['calendario.ver', 'calendario.gestionar']);
select tests.create_role('prueba_audiencias_ver', 'all', array['audiencias.ver']);
select tests.create_user('lector@prueba.test', 'prueba_calendario_ver');
select tests.create_user('gestor@prueba.test', 'prueba_calendario_gestion');
select tests.create_user('audiencias@prueba.test', 'prueba_audiencias_ver');

insert into public.non_business_days (day, kind, reason) values ('2030-06-10', 'festivo', 'Festivo de prueba');

select throws_ok(
  $$ insert into public.non_business_days (day, kind, reason) values ('2030-06-08', 'otro', 'Un sábado') $$,
  '23514', null,
  'solo de lunes a viernes (los fines de semana ya no son hábiles)'
);
select throws_ok(
  $$ insert into public.non_business_days (day, kind, reason) values ('2030-06-11', 'vacaciones', 'Otro tipo') $$,
  '23514', null,
  'el tipo es festivo, cierre u otro'
);

select tests.login_as_anon();
select throws_ok($$ select * from public.non_business_days $$, '42501', null, 'el público no lee la tabla');

select tests.login_as('audiencias@prueba.test');
select is((select count(*)::int from public.non_business_days), 0, 'sin calendario.ver no ve la tabla');
select results_eq(
  $$ select day from public.hearing_non_business_days('2030-06-01', '2030-06-30') $$,
  $$ values ('2030-06-10'::date) $$,
  'el calendario de audiencias sí los muestra, con audiencias.ver'
);

select tests.login_as('lector@prueba.test');
select is((select count(*)::int from public.non_business_days), 1, 'con calendario.ver los ve');
select throws_ok(
  $$ insert into public.non_business_days (day, kind, reason) values ('2030-06-11', 'cierre', 'Cierre de prueba') $$,
  '42501', null,
  'sin calendario.gestionar no agrega'
);

select tests.login_as('gestor@prueba.test');
select lives_ok(
  $$ insert into public.non_business_days (day, kind, reason) values ('2030-06-11', 'cierre', 'Cierre de prueba') $$,
  'con calendario.gestionar agrega'
);
select lives_ok($$ delete from public.non_business_days where day = '2030-06-10' $$, 'y elimina');

select * from finish();
rollback;
