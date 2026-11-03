-- Audiencias (docs/plan-audiencias.md, migraciones 20261008150000_hearings.sql,
-- 20261008170000/20261014150000 (lista pública), 20261009120000 (avisos de remate),
-- 20261013120000 (autor de la grabación) y 20261014120000 (cargado al expediente)).
-- src/dashboard/audiencias/data.ts y schedule.ts repiten estas reglas para la interfaz: cambiar juntos.
--
-- Fechas futuras fijas: el lunes 3 de junio de 2030 es día hábil (las migraciones no cargan
-- festivos) y el sábado 8 no. Las pasadas se escriben respecto de now(), porque la lista pública
-- solo mira 3 meses atrás.
begin;
create extension if not exists pgtap with schema extensions;
select plan(35);

select tests.create_role('prueba_audiencias', 'court', array[
  'audiencias.ver', 'audiencias.crear', 'audiencias.editar', 'audiencias.eliminar',
  'remates.ver', 'remates.crear', 'remates.editar', 'remates.eliminar'
]);
select tests.create_role('prueba_audiencias_lector', 'court', array['audiencias.ver']);
select tests.create_user('audiencias@prueba.test', 'prueba_audiencias', 1::smallint);
select tests.create_user('lectordos@prueba.test', 'prueba_audiencias_lector', 2::smallint);

insert into public.job_positions (name) values ('Cargo de prueba');
update public.profiles
set full_name = 'Ana Gómez', position_id = (select id from public.job_positions where name = 'Cargo de prueba')
where id = tests.user_id('audiencias@prueba.test');
insert into public.pdf_folders (group_id, folder_id, valid_from) values (111, 222, '2020-01-01');
insert into public.hearing_types (description, requires_link, is_active) values ('Tipo inactivo de prueba', false, false);
insert into public.non_business_days (day, kind, reason) values ('2030-06-10', 'festivo', 'Festivo de prueba');

-- Audiencias pasadas (como postgres: sin usuario, las reglas no actúan).
insert into public.hearings (scheduled_at, hearing_type_id, case_number, court_id, notes) values
  (now() - interval '2 hours', (select id from public.hearing_types where description = 'Audiencia de Pruebas'),
   '68001310300120260000201', 1, 'Nota interna'),
  (now() - interval '3 hours', (select id from public.hearing_types where description = 'Audiencia de Pruebas'),
   '68001310300120260000202', 1, null),
  (now() - interval '2 hours', (select id from public.hearing_types where description = 'Audiencia de Pruebas'),
   '68001310300220260000203', 2, 'Nota del juzgado 2');


-- Programar ----------------------------------------------------------------------------------------
select tests.login_as('audiencias@prueba.test');
select lives_ok(
  $$ insert into public.hearings (scheduled_at, hearing_type_id, case_number, court_id)
     values ('2030-06-03T09:00:00-05:00', (select id from public.hearing_types where description = 'Audiencia de Pruebas'), '68001310300120300000301', 1) $$,
  'programa una audiencia futura, en día hábil, dentro del horario y en pasos de 15 minutos'
);
select throws_ok(
  $$ insert into public.hearings (scheduled_at, hearing_type_id, case_number, court_id)
     values (now() - interval '1 day', (select id from public.hearing_types where description = 'Audiencia de Pruebas'), '68001310300120300000302', 1) $$,
  'P0001', 'hearing_past', 'no se programa en el pasado'
);
select throws_ok(
  $$ insert into public.hearings (scheduled_at, hearing_type_id, case_number, court_id)
     values ('2030-06-08T09:00:00-05:00', (select id from public.hearing_types where description = 'Audiencia de Pruebas'), '68001310300120300000303', 1) $$,
  'P0001', 'hearing_non_business_day', 'no se programa un sábado'
);
select throws_ok(
  $$ insert into public.hearings (scheduled_at, hearing_type_id, case_number, court_id)
     values ('2030-06-10T09:00:00-05:00', (select id from public.hearing_types where description = 'Audiencia de Pruebas'), '68001310300120300000304', 1) $$,
  'P0001', 'hearing_non_business_day', 'no se programa en un día no hábil de la tabla'
);
select throws_ok(
  $$ insert into public.hearings (scheduled_at, hearing_type_id, case_number, court_id)
     values ('2030-06-03T06:45:00-05:00', (select id from public.hearing_types where description = 'Audiencia de Pruebas'), '68001310300120300000305', 1) $$,
  'P0001', 'hearing_out_of_hours', 'no antes de las 7:00'
);
select throws_ok(
  $$ insert into public.hearings (scheduled_at, hearing_type_id, case_number, court_id)
     values ('2030-06-03T17:15:00-05:00', (select id from public.hearing_types where description = 'Audiencia de Pruebas'), '68001310300120300000306', 1) $$,
  'P0001', 'hearing_out_of_hours', 'no después de las 17:00'
);
select throws_ok(
  $$ insert into public.hearings (scheduled_at, hearing_type_id, case_number, court_id)
     values ('2030-06-03T09:10:00-05:00', (select id from public.hearing_types where description = 'Audiencia de Pruebas'), '68001310300120300000307', 1) $$,
  'P0001', 'hearing_invalid_minutes', 'solo en pasos de 15 minutos'
);
select throws_ok(
  $$ insert into public.hearings (scheduled_at, hearing_type_id, case_number, court_id)
     values ('2030-06-03T10:00:00-05:00', (select id from public.hearing_types where description = 'Tipo inactivo de prueba'),
             '68001310300120300000308', 1) $$,
  'P0001', 'hearing_type_inactive', 'no con un tipo inactivo'
);
select throws_ok(
  $$ insert into public.hearings (scheduled_at, hearing_type_id, case_number, court_id)
     values ('2030-06-03T10:00:00-05:00', (select id from public.hearing_types where description = 'Audiencia de Pruebas'), '68001310300220300000309', 2) $$,
  '42501', null, 'no programa en el otro juzgado'
);

-- Cerrar -----------------------------------------------------------------------------------------
select throws_ok(
  $$ update public.hearings set status_id = 2, recording_url = 'https://grabacion.test/1'
     where case_number = '68001310300120300000301' $$,
  'P0001', 'hearing_too_early_to_close', 'no se marca Realizada antes de una hora después'
);
select throws_ok(
  $$ update public.hearings set status_id = 3 where case_number = '68001310300120300000301' $$,
  'P0001', 'hearing_too_early_to_cancel', 'no se cancela antes de su hora'
);
select throws_ok(
  $$ update public.hearings set filed_at = now() where case_number = '68001310300120260000202' $$,
  'P0001', 'hearing_filed_not_realizada', 'solo una Realizada se marca cargada al expediente'
);
select throws_ok(
  $$ update public.hearings set status_id = 2 where case_number = '68001310300120260000201' $$,
  'P0001', 'hearing_recording_required', 'Realizada exige grabación'
);
select lives_ok(
  $$ update public.hearings set status_id = 2, recording_url = 'https://grabacion.test/1'
     where case_number = '68001310300120260000201' $$,
  'una hora después, con grabación, se marca Realizada'
);
select lives_ok(
  $$ update public.hearings set status_id = 3 where case_number = '68001310300120260000202' $$,
  'desde su hora se cancela'
);
select throws_ok(
  $$ update public.hearings set notes = 'Cambio' where case_number = '68001310300120260000201' $$,
  'P0001', 'hearing_closed', 'una audiencia cerrada no cambia sus datos'
);
select throws_ok(
  $$ update public.hearings set recording_url = 'https://grabacion.test/2' where case_number = '68001310300120260000202' $$,
  'P0001', 'hearing_closed', 'una Cancelada no recibe grabación'
);
select lives_ok(
  $$ update public.hearings set filed_at = '2000-01-01' where case_number = '68001310300120260000201' $$,
  'una Realizada se marca cargada al expediente'
);

select tests.logout();
select is(
  (select row(recording_set_by_name, recording_set_by_position, filed_by_name, filed_at > '2000-01-01')::text
   from public.hearings where case_number = '68001310300120260000201'),
  row('Ana Gómez', 'Cargo de prueba', 'Ana Gómez', true)::text,
  'autor de la grabación y del expediente con nombre y cargo; la hora del expediente es la del servidor'
);
select tests.login_as('audiencias@prueba.test');
update public.hearings set recording_url = 'https://grabacion.test/3' where case_number = '68001310300120260000201';
select tests.logout();
select is(
  (select row(filed_at, filed_by, filed_by_name)::text from public.hearings where case_number = '68001310300120260000201'),
  row(null::timestamptz, null::uuid, null::text)::text,
  'al corregir la grabación se desmarca el expediente'
);
select tests.login_as('audiencias@prueba.test');

-- Eliminar ---------------------------------------------------------------------------------------
select throws_ok(
  $$ delete from public.hearings where case_number = '68001310300120260000202' $$,
  'P0001', 'hearing_not_deletable', 'no se elimina una audiencia pasada o cerrada'
);
select lives_ok(
  $$ delete from public.hearings where case_number = '68001310300120300000301' $$,
  'se elimina una futura, programada, sin enlace ni grabación'
);

-- Lectura por juzgado y público -------------------------------------------------------------------
select tests.login_as('lectordos@prueba.test');
select results_eq(
  $$ select case_number from public.hearings order by case_number $$,
  $$ values ('68001310300220260000203') $$,
  'juzgado 2 solo ve las audiencias de su juzgado'
);
select is(
  (select count(*)::int from public.hearing_audit((select id from public.hearings limit 1))), 1,
  'hearing_audit responde para una audiencia de su juzgado'
);

select tests.login_as_anon();
select throws_ok($$ select * from public.hearings $$, '42501', null, 'el público no lee la tabla hearings');
select unalike(
  pg_get_function_result('public.list_public_hearings(text, smallint, smallint, date, date, text, integer, integer)'::regprocedure),
  '%notes%',
  'list_public_hearings no devuelve las notas internas'
);
select results_eq(
  $$ select case_number, status_id, pending_confirmation from public.list_public_hearings('anteriores') order by case_number $$,
  $$ values ('68001310300120260000201', 2::smallint, false), ('68001310300120260000202', 3::smallint, false),
            ('68001310300220260000203', 1::smallint, true) $$,
  'Anteriores: cerradas, y Programada 60 minutos después de su hora como "Por confirmar"'
);

-- Avisos de remate con su audiencia ----------------------------------------------------------------
select tests.login_as('audiencias@prueba.test');
select lives_ok(
  $$ select public.create_auction_notice_with_hearing('68001310300120300000401', 1::smallint, '2030-06-04T09:00:00-05:00', false) $$,
  'crea el aviso y su audiencia de remate en una transacción'
);
select is(
  (select t.description from public.hearings h join public.hearing_types t on t.id = h.hearing_type_id
   join public.auction_notices n on n.id = h.auction_notice_id
   where n.case_number = '68001310300120300000401'),
  'Audiencia de Remate',
  'la audiencia queda enlazada al aviso con el tipo Audiencia de Remate'
);
select lives_ok(
  $$ update public.auction_notices set scheduled_at = '2030-06-05T11:00:00-05:00' where case_number = '68001310300120300000401' $$,
  'cambiar la fecha del aviso'
);
select is(
  (select scheduled_at from public.hearings where case_number = '68001310300120300000401'),
  '2030-06-05T11:00:00-05:00'::timestamptz,
  'mueve la audiencia enlazada'
);
select throws_ok(
  $$ update public.auction_notices set scheduled_at = '2030-06-08T11:00:00-05:00' where case_number = '68001310300120300000401' $$,
  'P0001', 'hearing_non_business_day',
  'no mueve el aviso a una fecha que rompe las reglas de la audiencia'
);
select lives_ok(
  $$ delete from public.auction_notices where case_number = '68001310300120300000401' $$,
  'eliminar el aviso'
);
select tests.logout();
select is(
  (select count(*)::int from public.hearings where case_number = '68001310300120300000401'),
  0,
  'al eliminar el aviso se elimina su audiencia futura sin enlace ni grabación'
);
select throws_ok(
  $$ select public.link_hearing_to_notice(
       (select id from public.hearings where case_number = '68001310300220260000203'), gen_random_uuid()) $$,
  'P0001', 'link_mismatch', 'link_hearing_to_notice exige que coincidan radicado, juzgado y hora'
);

select * from finish();
rollback;
