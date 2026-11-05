-- PQRS (docs/plan-pqrs-dashboard.md, migraciones 20261007120000 (número), 20261007140000_pqrs_admin.sql
-- y 20261007150000_non_business_days.sql (plazo)). src/dashboard/pqrs/deadline.ts solo decide cómo
-- mostrar el plazo: el cálculo es este.
--
-- Fechas fijas en 2030: el lunes 3 de junio, el plazo de 15 días hábiles vence el lunes 24.
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

select tests.create_role('prueba_pqrs_ver', 'all', array['pqrs.ver']);
select tests.create_role('prueba_pqrs_gestion', 'all', array['pqrs.ver', 'pqrs.gestionar']);
select tests.create_role('prueba_sin_pqrs', 'all', array['remates.ver']);
select tests.create_user('lector@prueba.test', 'prueba_pqrs_ver');
select tests.create_user('gestor@prueba.test', 'prueba_pqrs_gestion');
select tests.create_user('ajeno@prueba.test', 'prueba_sin_pqrs');

-- Como postgres: así las crea submit-request con la clave secreta.
insert into public.customer_requests (type, name, email, summary, created_at) values
  ('peticion', 'Ciudadano Uno', 'uno@prueba.test', 'Primera solicitud de prueba', '2030-06-03T10:00:00-05:00'),
  ('queja', 'Ciudadano Dos', 'dos@prueba.test', 'Segunda solicitud de prueba', '2030-06-03T23:30:00-05:00');
insert into public.customer_requests (type, name, email, summary, status, response, responded_at, created_at) values
  ('reclamo', 'Ciudadano Tres', 'tres@prueba.test', 'Tercera solicitud de prueba', 'respondida', 'Respuesta', now(),
   '2030-06-04T10:00:00-05:00');

select results_eq(
  $$ select request_number from public.customer_requests order by created_at $$,
  $$ values ('PQRS-2030-000001'), ('PQRS-2030-000002'), ('PQRS-2030-000003') $$,
  'el número es PQRS-<año de Bogotá>-<6 dígitos>, consecutivo por año'
);
select throws_ok(
  $$ insert into public.customer_requests (type, name, email, summary) values ('otro', 'N', 'n@prueba.test', 'Resumen') $$,
  '23514', null,
  'el tipo debe ser uno de los cinco'
);

-- Plazo en días hábiles ------------------------------------------------------------------------------
select is(public.pqrs_due_date('2030-06-03T10:00:00-05:00'), '2030-06-24'::date, '15 días hábiles desde el día siguiente');
select is(
  public.pqrs_due_date('2030-06-03T23:30:00-05:00'), '2030-06-24'::date,
  'cuenta el día de Bogotá (23:30 del lunes sigue siendo lunes)'
);
select is(public.business_days_between('2030-06-03', '2030-06-10'), 5, 'días hábiles entre dos fechas');
select is(public.business_days_between('2030-06-10', '2030-06-03'), -5, 'negativo si la segunda es anterior');
insert into public.non_business_days (day, kind, reason) values ('2030-06-10', 'festivo', 'Festivo de prueba');
select is(public.pqrs_due_date('2030-06-03T10:00:00-05:00'), '2030-06-25'::date, 'un día no hábil corre el plazo');
select is(public.business_days_between('2030-06-03', '2030-06-10'), 4, 'y no cuenta como hábil');
select ok(not public.is_business_day('2030-06-08'), 'el sábado no es hábil');

-- Acceso -----------------------------------------------------------------------------------------------
select tests.login_as_anon();
select throws_ok($$ select * from public.customer_requests $$, '42501', null, 'el público no lee las PQRS');
select throws_ok(
  $$ insert into public.customer_requests (type, name, email, summary) values ('peticion', 'N', 'n@prueba.test', 'R') $$,
  '42501', null,
  'el público no escribe en la tabla (solo submit-request, con captcha)'
);

select tests.login_as('ajeno@prueba.test');
select is((select count(*)::int from public.customer_requests), 0, 'sin pqrs.ver no ve ninguna PQRS');
select throws_ok($$ select * from public.pqrs_summary() $$, '42501', 'forbidden', 'pqrs_summary exige pqrs.ver');

select tests.login_as('lector@prueba.test');
select is((select count(*)::int from public.customer_requests), 3, 'con pqrs.ver las ve todas (no van por juzgado)');
select is(
  (select public.due_date(c) from public.customer_requests c where request_number = 'PQRS-2030-000001'),
  '2030-06-25'::date,
  'la columna calculada due_date usa el mismo plazo'
);
select throws_ok(
  $$ update public.customer_requests set status = 'cerrada', closed_reason = 'Motivo' $$,
  '42501', null,
  'el navegador no actualiza la tabla'
);
select throws_ok(
  $$ select public.set_request_status((select id from public.customer_requests where request_number = 'PQRS-2030-000001'), 'en_tramite') $$,
  '42501', 'forbidden',
  'set_request_status exige pqrs.gestionar'
);

-- Cambios de estado ----------------------------------------------------------------------------------
select tests.login_as('gestor@prueba.test');
select throws_ok(
  $$ select public.set_request_status((select id from public.customer_requests where request_number = 'PQRS-2030-000001'), 'cerrada', 'no') $$,
  'P0001', 'reason_required',
  'cerrar exige un motivo de al menos 5 caracteres'
);
select throws_ok(
  $$ select public.set_request_status((select id from public.customer_requests where request_number = 'PQRS-2030-000001'), 'respondida') $$,
  'P0001', 'invalid_status',
  'respondida no se pone a mano (solo respond-request)'
);
select throws_ok(
  $$ select public.set_request_status((select id from public.customer_requests where request_number = 'PQRS-2030-000003'), 'en_tramite') $$,
  'P0001', 'request_answered',
  'una respondida no cambia de estado'
);
select lives_ok(
  $$ select public.set_request_status((select id from public.customer_requests where request_number = 'PQRS-2030-000001'),
                                      'cerrada', 'Duplicada de otra solicitud') $$,
  'cierra con motivo'
);
select tests.logout();
select is(
  (select row(status, closed_reason, closed_at is not null, updated_by)::text
   from public.customer_requests where request_number = 'PQRS-2030-000001'),
  row('cerrada', 'Duplicada de otra solicitud', true, tests.user_id('gestor@prueba.test'))::text,
  'queda cerrada con motivo, fecha y quién la cerró'
);

select * from finish();
rollback;
