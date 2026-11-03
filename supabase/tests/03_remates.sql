-- Avisos de remate (docs/plan-remates-dashboard.md, migraciones 20261002120000_create_auction_notices.sql
-- y 20261005180000_auction_notices_admin.sql). La fórmula de la URL del PDF se repite en
-- src/dashboard/remates/pdfUrl.ts: cambiar las dos juntas.
begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

select tests.create_role('prueba_editor', 'court', array['remates.ver', 'remates.crear', 'remates.editar']);
select tests.create_role('prueba_publicador', 'court', array['remates.ver', 'remates.publicar']);
select tests.create_role('prueba_lector', 'court', array['remates.ver']);
select tests.create_user('editoruno@prueba.test', 'prueba_editor', 1::smallint);
select tests.create_user('publicadoruno@prueba.test', 'prueba_publicador', 1::smallint);
select tests.create_user('lectordos@prueba.test', 'prueba_lector', 2::smallint);

-- Datos (como postgres: sin usuario, los triggers de autorización no actúan).
insert into public.pdf_folders (group_id, folder_id, valid_from) values (111, 222, '2020-01-01');
insert into public.auction_notices (id, case_number, court, scheduled_at, is_published) values
  ('00000000-0000-0000-0000-0000000000a1', '68001310300120200000101', 1, '2026-12-01T09:00:00-05:00', true),
  ('00000000-0000-0000-0000-0000000000a2', '68001310300120200000102', 1, '2026-12-02T09:00:00-05:00', false),
  ('00000000-0000-0000-0000-0000000000a3', '68001310300220200000103', 2, '2026-12-03T09:00:00-05:00', false);

-- URL del PDF ---------------------------------------------------------------------------------
select is(
  (select pdf_url from public.auction_notices where id = '00000000-0000-0000-0000-0000000000a1'),
  'https://publicacionesprocesales.ramajudicial.gov.co/documents/111/222/68001310300120200000101-2026120109-J01ECC.pdf',
  'el trigger arma la URL del PDF con la carpeta vigente y la hora de 12 horas de Bogotá'
);
update public.auction_notices set scheduled_at = '2026-12-01T15:00:00-05:00'
where id = '00000000-0000-0000-0000-0000000000a1';
select is(
  (select pdf_url from public.auction_notices where id = '00000000-0000-0000-0000-0000000000a1'),
  'https://publicacionesprocesales.ramajudicial.gov.co/documents/111/222/68001310300120200000101-2026120103-J01ECC.pdf',
  'al cambiar la hora se rehace la URL (15:00 queda como 03)'
);
select throws_ok(
  $$ update public.auction_notices set pdf_url = 'javascript:alert(1)' where id = '00000000-0000-0000-0000-0000000000a1' $$,
  '23514', null,
  'la URL del PDF debe empezar por https://'
);
update public.auction_notices set created_at = '2000-01-01' where id = '00000000-0000-0000-0000-0000000000a1';
select isnt(
  (select created_at from public.auction_notices where id = '00000000-0000-0000-0000-0000000000a1'),
  '2000-01-01'::timestamptz,
  'created_at no cambia'
);

-- Público ----------------------------------------------------------------------------------------
select tests.login_as_anon();
select results_eq(
  $$ select id::text from public.auction_notices order by id $$,
  $$ values ('00000000-0000-0000-0000-0000000000a1') $$,
  'el público solo ve los avisos publicados'
);
select throws_ok(
  $$ insert into public.auction_notices (case_number, court, scheduled_at) values ('68001310300120200000199', 1, now()) $$,
  '42501', null,
  'el público no crea avisos'
);
select throws_ok($$ select * from public.pdf_folders $$, '42501', null, 'el público no lee las carpetas');

-- Lectura por juzgado ----------------------------------------------------------------------------
select tests.login_as('lectordos@prueba.test');
select results_eq(
  $$ select id::text from public.auction_notices order by id $$,
  $$ values ('00000000-0000-0000-0000-0000000000a1'), ('00000000-0000-0000-0000-0000000000a3') $$,
  'juzgado 2 ve los publicados y los ocultos de su juzgado, no los ocultos del juzgado 1'
);
select is(
  (select count(*)::int from public.auction_notice_audit('00000000-0000-0000-0000-0000000000a2')),
  0,
  'auction_notice_audit no muestra autores de otro juzgado'
);
update public.auction_notices set case_number = '68001310300220200000999' where id = '00000000-0000-0000-0000-0000000000a3';

-- Crear --------------------------------------------------------------------------------------------
select tests.login_as('editoruno@prueba.test');
select lives_ok(
  $$ insert into public.auction_notices (case_number, court, scheduled_at, is_published)
     values ('68001310300120200000104', 1, '2026-12-04T10:00:00-05:00', true) $$,
  'editor del juzgado 1 crea un aviso en su juzgado'
);
select throws_ok(
  $$ insert into public.auction_notices (case_number, court, scheduled_at)
     values ('68001310300220200000105', 2, '2026-12-05T10:00:00-05:00') $$,
  '42501', null,
  'no crea avisos en el otro juzgado'
);
select ok(
  (select count(*) = 1 from public.pdf_folders),
  'quien crea avisos lee las carpetas (las necesita el trigger de la URL)'
);
select throws_ok(
  $$ insert into public.pdf_folders (group_id, folder_id, valid_from) values (1, 2, '2030-01-01') $$,
  '42501', null,
  'sin remates.carpetas no agrega carpetas'
);

-- Editar y publicar ----------------------------------------------------------------------------------
select lives_ok(
  $$ update public.auction_notices set scheduled_at = '2026-12-02T11:00:00-05:00'
     where id = '00000000-0000-0000-0000-0000000000a2' $$,
  'con remates.editar cambia la fecha'
);
select throws_ok(
  $$ update public.auction_notices set is_published = true where id = '00000000-0000-0000-0000-0000000000a2' $$,
  '42501', 'remates_publicar_required',
  'sin remates.publicar no publica'
);
select throws_ok(
  $$ update public.auction_notices set court = 2 where id = '00000000-0000-0000-0000-0000000000a2' $$,
  '42501', 'remates_editar_required',
  'no pasa un aviso al juzgado donde no tiene remates.editar'
);
delete from public.auction_notices where id = '00000000-0000-0000-0000-0000000000a2';

select tests.login_as('publicadoruno@prueba.test');
select lives_ok(
  $$ update public.auction_notices set is_published = true where id = '00000000-0000-0000-0000-0000000000a2' $$,
  'con remates.publicar publica'
);
select throws_ok(
  $$ update public.auction_notices set case_number = '68001310300120200000777' where id = '00000000-0000-0000-0000-0000000000a2' $$,
  '42501', 'remates_editar_required',
  'sin remates.editar no cambia el radicado'
);

-- Resultado (como postgres) --------------------------------------------------------------------------
select tests.logout();
select is(
  (select is_published from public.auction_notices where case_number = '68001310300120200000104'),
  false,
  'creado sin remates.publicar, el aviso nace oculto'
);
select is(
  (select created_by from public.auction_notices where case_number = '68001310300120200000104'),
  tests.user_id('editoruno@prueba.test'),
  'created_by es quien lo creó'
);
select is(
  (select updated_by from public.auction_notices where id = '00000000-0000-0000-0000-0000000000a2'),
  tests.user_id('publicadoruno@prueba.test'),
  'updated_by es el último que lo cambió'
);
select ok(
  exists (select 1 from public.auction_notices where id = '00000000-0000-0000-0000-0000000000a2'),
  'sin remates.eliminar no se borra'
);
select is(
  (select case_number from public.auction_notices where id = '00000000-0000-0000-0000-0000000000a3'),
  '68001310300220200000103',
  'con solo remates.ver no se edita'
);

select * from finish();
rollback;
