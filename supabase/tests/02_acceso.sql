-- Acceso: has_permission, perfiles, roles y permisos (docs/plan-usuarios.md, migraciones
-- 20261005150000_roles_permissions.sql, 20261005170000_roles_admin.sql, 20261013120000_hearing_format.sql).
-- El front lo repite solo para mostrar u ocultar (src/dashboard/access/): la barrera es esto.
begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

-- Roles de prueba con permisos explícitos (los permisos de los roles reales cambian en producción).
select tests.create_role('prueba_juzgado', 'court', array['remates.ver', 'usuarios.ver']);
select tests.create_role('prueba_oficina', 'all', array['remates.ver']);
select tests.create_role('prueba_roles', 'all', array['roles.ver', 'roles.gestionar']);

select tests.create_user('juzgadouno@prueba.test', 'prueba_juzgado', 1::smallint);
select tests.create_user('juzgadodos@prueba.test', 'prueba_juzgado', 2::smallint);
select tests.create_user('oficina@prueba.test', 'prueba_oficina');
select tests.create_user('inactivo@prueba.test', 'prueba_juzgado', 1::smallint, false);
select tests.create_user('gestor@prueba.test', 'prueba_roles');
select tests.create_user('sinrol@prueba.test');
select tests.create_user('admin@prueba.test', 'superadmin');

-- has_permission ------------------------------------------------------------------------------
select tests.login_as('juzgadouno@prueba.test');
select ok(public.has_permission('remates.ver', 1::smallint), 'juzgado 1: permiso en su juzgado');
select ok(not public.has_permission('remates.ver', 2::smallint), 'juzgado 1: sin permiso en el juzgado 2');
select ok(public.has_permission('remates.ver'), 'juzgado 1: sin juzgado en la consulta, cuenta el permiso');
select ok(not public.has_permission('remates.editar', 1::smallint), 'juzgado 1: sin un permiso que su rol no tiene');

select tests.login_as('oficina@prueba.test');
select ok(
  public.has_permission('remates.ver', 1::smallint) and public.has_permission('remates.ver', 2::smallint),
  'oficina (alcance all): permiso en los dos juzgados'
);

select tests.login_as('inactivo@prueba.test');
select ok(not public.has_permission('remates.ver', 1::smallint), 'usuario inactivo: ningún permiso');

select tests.login_as('sinrol@prueba.test');
select ok(not public.has_permission('remates.ver'), 'usuario sin rol: ningún permiso');

select tests.login_as('admin@prueba.test');
select ok(
  public.has_permission('remates.eliminar', 2::smallint) and public.has_permission('modulo.futuro'),
  'superadmin: todos los permisos, también los futuros'
);

select tests.login_as_anon();
select throws_ok(
  $$ select public.has_permission('remates.ver') $$,
  '42501', null,
  'anónimo: no puede llamar has_permission'
);

-- get_my_access -------------------------------------------------------------------------------
select tests.login_as('juzgadouno@prueba.test');
select is(
  public.get_my_access() - 'role_name',
  jsonb_build_object(
    'role', 'prueba_juzgado', 'scope', 'court', 'court', 1, 'active', true,
    'must_change_password', false, 'permissions', jsonb_build_array('remates.ver', 'usuarios.ver')
  ),
  'get_my_access devuelve rol, alcance, juzgado y permisos del usuario en sesión'
);

select tests.login_as('sinrol@prueba.test');
select is(public.get_my_access() ->> 'role', null, 'get_my_access: usuario sin rol no tiene rol');

-- profiles: cada uno ve solo su fila y escribe solo su nombre y cargo ---------------------------
select tests.login_as('juzgadouno@prueba.test');
select is((select count(*)::int from public.profiles), 1, 'cada usuario ve solo su perfil');

select lives_ok(
  $$ update public.profiles set full_name = 'Juan Pérez' where id = auth.uid() $$,
  'cambia su propio nombre'
);
select throws_ok(
  $$ update public.profiles set role_id = (select id from public.roles where code = 'superadmin') where id = auth.uid() $$,
  '42501', null,
  'no se cambia el rol'
);
select throws_ok(
  $$ update public.profiles set court = 2 where id = auth.uid() $$,
  '42501', null,
  'no se cambia el juzgado'
);
select throws_ok(
  $$ update public.profiles set active = true where id = auth.uid() $$,
  '42501', null,
  'no cambia si está activo'
);
select throws_ok(
  $$ update public.profiles set must_change_password = false where id = auth.uid() $$,
  '42501', null,
  'no quita el aviso de contraseña temporal'
);
select throws_ok(
  $$ update public.profiles set full_name = 'Juan 2' where id = auth.uid() $$,
  '23514', null,
  'el nombre cumple profiles_full_name_format (sin números)'
);

update public.profiles set full_name = 'Otro Nombre' where id = tests.user_id('juzgadodos@prueba.test');
select tests.logout();
select is(
  (select full_name from public.profiles where id = tests.user_id('juzgadodos@prueba.test')),
  'juzgadodos',
  'no cambia el nombre de otro usuario (RLS)'
);
select is(
  (select full_name from public.profiles where id = tests.user_id('juzgadouno@prueba.test')),
  'Juan Pérez',
  'el nombre propio quedó guardado'
);

-- complete_password_change exige cargo ----------------------------------------------------------
update public.profiles set must_change_password = true where id = tests.user_id('juzgadouno@prueba.test');
select tests.login_as('juzgadouno@prueba.test');
select throws_ok(
  $$ select public.complete_password_change() $$,
  'P0001', 'position_required',
  'complete_password_change: sin cargo no quita el aviso'
);
select tests.logout();
insert into public.job_positions (name) values ('Cargo de prueba');
update public.profiles
set position_id = (select id from public.job_positions where name = 'Cargo de prueba')
where id = tests.user_id('juzgadouno@prueba.test');
select tests.login_as('juzgadouno@prueba.test');
select public.complete_password_change();
select tests.logout();
select is(
  (select must_change_password from public.profiles where id = tests.user_id('juzgadouno@prueba.test')),
  false,
  'complete_password_change: con cargo quita el aviso'
);

-- Reglas de los perfiles (también para la clave secreta de manage-users) ------------------------
select throws_ok(
  $$ update public.profiles set court = null where id = tests.user_id('juzgadodos@prueba.test') $$,
  'P0001', 'court_required',
  'un rol de alcance court exige juzgado'
);
select throws_ok(
  $$ update public.profiles set court = 1 where id = tests.user_id('oficina@prueba.test') $$,
  'P0001', 'court_not_allowed',
  'un rol de alcance all no lleva juzgado'
);
select throws_ok(
  $$ update public.profiles set active = false where id = tests.user_id('admin@prueba.test') $$,
  'P0001', 'last_superadmin',
  'no se desactiva el último superadmin activo'
);
select tests.create_user('admindos@prueba.test', 'superadmin');
select lives_ok(
  $$ update public.profiles set active = false where id = tests.user_id('admin@prueba.test') $$,
  'con otro superadmin activo, sí se desactiva'
);

-- Roles de sistema --------------------------------------------------------------------------------
select throws_ok(
  $$ update public.roles set name = 'Otro' where code = 'superadmin' $$,
  'P0001', 'system_role',
  'el rol superadmin no se modifica'
);
select throws_ok(
  $$ insert into public.role_permissions (role_id, permission_code)
     select id, 'remates.ver' from public.roles where code = 'superadmin' $$,
  'P0001', 'system_role',
  'al superadmin no se le asignan permisos (ya tiene todos)'
);

-- Roles desde el navegador: roles.gestionar ---------------------------------------------------------
select tests.login_as('oficina@prueba.test');
select throws_ok(
  $$ insert into public.roles (code, name, scope) values ('intruso', 'Intruso', 'all') $$,
  '42501', null,
  'sin roles.gestionar no se crean roles'
);
select tests.login_as('gestor@prueba.test');
select lives_ok(
  $$ insert into public.roles (code, name, scope) values ('nuevo_rol', 'Nuevo rol', 'court') $$,
  'con roles.gestionar se crean roles'
);

-- list_users exige usuarios.ver ---------------------------------------------------------------------
select tests.login_as('oficina@prueba.test');
select throws_ok($$ select * from public.list_users() $$, '42501', 'forbidden', 'list_users: sin usuarios.ver');

select * from finish();
rollback;
