-- Información personal y contacto de emergencia (docs/plan-perfil-informacion-personal.md, migraciones
-- 20261027120000_profile_personal_info.sql, 20261028120000_personal_info_section_dates.sql y
-- 20261028130000_personal_email_ascii.sql). Las reglas de formato se repiten en
-- src/dashboard/profile/personalSchema.ts: cambiar las dos juntas.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

select tests.create_role('prueba_datos_juzgado', 'court', array['usuarios.datos_personales']);
select tests.create_role('prueba_datos_oficina', 'all', array['usuarios.datos_personales']);
select tests.create_role('prueba_sin_datos', 'all', array['usuarios.ver']);
select tests.create_user('juzgadouno@prueba.test', 'prueba_datos_juzgado', 1::smallint);
select tests.create_user('juzgadodos@prueba.test', 'prueba_datos_juzgado', 2::smallint);
select tests.create_user('oficina@prueba.test', 'prueba_datos_oficina');
select tests.create_user('ajeno@prueba.test', 'prueba_sin_datos');

-- Escribir lo propio -------------------------------------------------------------------------------
select tests.login_as('juzgadodos@prueba.test');
select lives_ok(
  $$ insert into public.profile_personal_info (user_id, mobile_phone, emergency_name, emergency_relationship, emergency_phone)
     values (auth.uid(), '3001234567', 'María López', 'madre', '3109876543') $$,
  'guarda su propia información'
);
select throws_ok(
  $$ insert into public.profile_personal_info (user_id, mobile_phone)
     values (tests.user_id('oficina@prueba.test'), '3001234567') $$,
  '42501', null,
  'no escribe la información de otro'
);
select throws_ok(
  $$ delete from public.profile_personal_info $$,
  '42501', null,
  'no borra la fila (se vacían los campos)'
);
select throws_ok(
  $$ update public.profile_personal_info set mobile_phone = '6071234567' where user_id = auth.uid() $$,
  '23514', null, 'el celular empieza por 3 y tiene 10 dígitos'
);
select throws_ok(
  $$ update public.profile_personal_info set personal_email = 'Mayus@Prueba.test' where user_id = auth.uid() $$,
  '23514', null, 'el correo personal va en minúsculas'
);
select throws_ok(
  $$ update public.profile_personal_info set personal_email = 'josé@prueba.test' where user_id = auth.uid() $$,
  '23514', null, 'el correo personal sin tildes'
);
select throws_ok(
  $$ update public.profile_personal_info set emergency_relationship = 'vecino' where user_id = auth.uid() $$,
  '23514', null, 'el parentesco es uno de la lista'
);
select throws_ok(
  $$ update public.profile_personal_info set emergency_name = 'Ma' where user_id = auth.uid() $$,
  '23514', null, 'el nombre del contacto cumple la misma regla que el nombre del perfil'
);
select throws_ok(
  $$ update public.profile_personal_info set residence_address = 'Calle 1' || chr(10) || '# 2-3' where user_id = auth.uid() $$,
  '23514', null, 'la dirección es de una línea'
);

-- Fechas por pestaña ---------------------------------------------------------------------------------
select tests.logout();
update public.profile_personal_info
set personal_updated_at = '2000-01-01', emergency_updated_at = '2000-01-01'
where user_id = tests.user_id('juzgadodos@prueba.test');
select is(
  (select row(personal_updated_at, emergency_updated_at)::text from public.profile_personal_info
   where user_id = tests.user_id('juzgadodos@prueba.test')),
  row(now(), now())::text,
  'las fechas por pestaña las pone el trigger, no quien escribe'
);
alter table public.profile_personal_info disable trigger profile_personal_info_section_dates;
update public.profile_personal_info set personal_updated_at = '2000-01-01', emergency_updated_at = '2000-01-01'
where user_id = tests.user_id('juzgadodos@prueba.test');
alter table public.profile_personal_info enable trigger profile_personal_info_section_dates;

select tests.login_as('juzgadodos@prueba.test');
update public.profile_personal_info set emergency_phone = '3111111111' where user_id = auth.uid();
select tests.logout();
select is(
  (select row(personal_updated_at, emergency_updated_at)::text from public.profile_personal_info
   where user_id = tests.user_id('juzgadodos@prueba.test')),
  row('2000-01-01'::timestamptz, now())::text,
  'cambiar el contacto de emergencia solo actualiza la fecha de esa pestaña'
);
select tests.login_as('juzgadodos@prueba.test');
update public.profile_personal_info set mobile_phone = null where user_id = auth.uid();
select tests.logout();
select is(
  (select personal_updated_at from public.profile_personal_info where user_id = tests.user_id('juzgadodos@prueba.test')),
  null,
  'una pestaña vacía queda sin fecha'
);

-- Leer lo de otros -------------------------------------------------------------------------------------
select tests.login_as('juzgadouno@prueba.test');
select is((select count(*)::int from public.profile_personal_info), 0, 'cada uno lee solo su propia fila');
select throws_ok(
  $$ select * from public.get_user_personal_info(tests.user_id('juzgadodos@prueba.test')) $$,
  '42501', 'forbidden', 'con permiso de alcance juzgado no ve a un usuario de otro juzgado'
);
select throws_ok(
  $$ select * from public.get_user_personal_info(tests.user_id('oficina@prueba.test')) $$,
  '42501', 'forbidden', 'ni a uno de la oficina (sin juzgado)'
);

select tests.login_as('oficina@prueba.test');
select is(
  (select emergency_name from public.get_user_personal_info(tests.user_id('juzgadodos@prueba.test'))),
  'María López',
  'con usuarios.datos_personales de alcance all ve a cualquiera'
);

select tests.login_as('ajeno@prueba.test');
select throws_ok(
  $$ select * from public.get_user_personal_info(tests.user_id('juzgadodos@prueba.test')) $$,
  '42501', 'forbidden', 'sin usuarios.datos_personales no ve nada'
);
select throws_ok(
  $$ select * from public.get_user_personal_info(gen_random_uuid()) $$,
  '42501', 'forbidden', 'un usuario que no existe responde igual'
);

select tests.login_as_anon();
select throws_ok($$ select * from public.profile_personal_info $$, '42501', null, 'el público no lee la tabla');
select throws_ok(
  $$ select * from public.get_user_personal_info(gen_random_uuid()) $$,
  '42501', null, 'ni llama get_user_personal_info'
);

select * from finish();
rollback;
