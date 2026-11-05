-- Entorno de las pruebas (docs/plan-pruebas.md, Fase 4): las migraciones recrean la base desde
-- cero, las ayudas de supabase/seed.sql funcionan y "entrar como" cambia auth.uid() y el rol.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

select has_table('public', 'profiles', 'las migraciones crean profiles');
select is(
  (select count(*)::int from public.roles where code in ('superadmin', 'juzgado', 'oficina', 'director_oficina')),
  4,
  'existen los roles base de las migraciones'
);
select is((select count(*)::int from public.execution_courts), 2, 'existen los dos juzgados');

select tests.create_role('rol_prueba', 'court', array['remates.ver']);
select tests.create_user('juzgadouno@prueba.test', 'rol_prueba', 1::smallint);

select is(
  (select full_name from public.profiles where id = tests.user_id('juzgadouno@prueba.test')),
  'juzgadouno',
  'el trigger on_auth_user_created crea el perfil'
);

select tests.login_as('juzgadouno@prueba.test');
select is(current_user::text, 'authenticated', 'login_as entra con el rol authenticated');
select is(auth.uid(), tests.user_id('juzgadouno@prueba.test'), 'auth.uid() es el usuario de prueba');
select ok(public.has_permission('remates.ver', 1::smallint), 'tiene el permiso en su juzgado');
select ok(not public.has_permission('remates.ver', 2::smallint), 'no lo tiene en el otro juzgado');

select tests.login_as_anon();
select is(current_user::text, 'anon', 'login_as_anon entra como visitante');

select tests.logout();
select is(current_user::text, 'postgres', 'logout vuelve a postgres');

select * from finish();
rollback;
