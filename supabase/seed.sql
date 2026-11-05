-- Ayudas para las pruebas pgTAP de supabase/tests/ (docs/plan-pruebas.md, Fase 4).
--
-- Solo se carga en una base local (supabase start / supabase db reset, y en GitHub Actions):
-- nunca llega a producción. No crea datos: cada prueba crea los suyos dentro de su transacción y
-- los deshace al final.
--
-- Uso típico dentro de una prueba:
--   select tests.create_role('rol_prueba', 'court', array['remates.ver']);
--   select tests.create_user('juzgadouno@prueba.test', 'rol_prueba', 1);
--   select tests.login_as('juzgadouno@prueba.test');   -- authenticated con ese usuario
--   ...
--   select tests.login_as_anon();                       -- visitante sin sesión
--   select tests.logout();                              -- vuelve a postgres (sin RLS)

create schema if not exists tests;
grant usage on schema tests to anon, authenticated;

-- Rol con permisos explícitos. Las pruebas usan sus propios roles en vez de los de las
-- migraciones, porque los permisos de los roles reales cambian en producción (se asignan en Roles).
create or replace function tests.create_role(p_code text, p_scope text, p_permissions text[] default '{}')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role uuid;
begin
  insert into public.roles (code, name, scope)
  values (p_code, 'Prueba ' || p_code, p_scope)
  returning id into v_role;

  insert into public.role_permissions (role_id, permission_code)
  select v_role, unnest(p_permissions);

  return v_role;
end;
$$;

-- Cuenta de Auth con su perfil (lo crea el trigger on_auth_user_created), rol y juzgado.
-- La parte del correo antes de @ queda como nombre y debe cumplir profiles_full_name_format:
-- solo letras (por ejemplo juzgadouno@prueba.test).
create or replace function tests.create_user(
  p_email text,
  p_role text default null,
  p_court smallint default null,
  p_active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := gen_random_uuid();
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  values (
    v_user, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email, '',
    now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now()
  );

  if p_role is not null then
    update public.profiles
    set role_id = (select id from public.roles where code = p_role),
        court = p_court,
        active = p_active
    where id = v_user;
  end if;

  return v_user;
end;
$$;

create or replace function tests.user_id(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from auth.users where email = p_email;
$$;

-- Hace que el resto de la transacción corra como ese usuario: rol authenticated y su JWT, que es
-- lo que leen auth.uid() y las políticas RLS.
create or replace function tests.login_as(p_email text)
returns void
language plpgsql
as $$
declare
  v_user uuid := tests.user_id(p_email);
begin
  if v_user is null then
    raise exception 'tests.login_as: no existe el usuario de prueba %', p_email;
  end if;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_user, 'role', 'authenticated', 'email', p_email)::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

create or replace function tests.login_as_anon()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', '{"role": "anon"}', true);
  perform set_config('role', 'anon', true);
end;
$$;

-- Vuelve al usuario de la sesión (postgres), para preparar datos sin RLS.
create or replace function tests.logout()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'none', true);
end;
$$;

revoke all on all functions in schema tests from public;
grant execute on function tests.user_id(text) to anon, authenticated;
grant execute on function tests.login_as(text) to anon, authenticated;
grant execute on function tests.login_as_anon() to anon, authenticated;
grant execute on function tests.logout() to anon, authenticated;
