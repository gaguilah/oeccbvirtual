-- Usuarios, roles y permisos: fase 1 (docs/plan-usuarios.md).
--
-- Modelo: un rol por usuario. El rol dice QUÉ puede hacer (sus permisos) y su alcance dice SOBRE
-- QUÉ juzgado: 'all' (los dos: superadmin, oficina) o 'court' (solo profiles.court: juzgado).
-- Las políticas de cada sección usarán public.has_permission('<módulo>.<acción>', court).
--
-- Cada sección agrega sus permisos en su propia migración, junto con las políticas que los usan:
-- un permiso que nada revisa no protege nada.

-- ---------------------------------------------------------------------------------------------
-- updated_at genérico (profiles tiene el suyo desde 20261005120000).
-- ---------------------------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Catálogo de permisos.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.permissions (
  code text primary key
    constraint permissions_code_format check (code ~ '^[a-z_]+\.[a-z_]+$'),
  module text not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists permissions_set_updated_at on public.permissions;
create trigger permissions_set_updated_at
  before update on public.permissions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------------------------
-- Roles.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique
    constraint roles_code_format check (code ~ '^[a-z_]+$'),
  name text not null,
  description text,
  scope text not null
    constraint roles_scope_chk check (scope in ('all', 'court')),
  -- superadmin: no se borra ni se modifica; tiene todos los permisos sin filas en role_permissions.
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists roles_set_updated_at on public.roles;
create trigger roles_set_updated_at
  before update on public.roles
  for each row execute function public.set_updated_at();

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_code text not null references public.permissions (code) on delete cascade on update cascade,
  primary key (role_id, permission_code)
);

create index if not exists role_permissions_permission_code_idx on public.role_permissions (permission_code);

-- ---------------------------------------------------------------------------------------------
-- Perfiles: rol, juzgado, estado y contraseña temporal.
-- Ninguna de estas columnas está en el grant update (full_name) de 20261005130000: nadie se las
-- cambia desde el navegador. Las escribe la Edge Function manage-users (fase 2).
-- ---------------------------------------------------------------------------------------------
alter table public.profiles add column if not exists role_id uuid references public.roles (id) on delete restrict;
alter table public.profiles add column if not exists court smallint;
alter table public.profiles add column if not exists active boolean not null default true;
alter table public.profiles add column if not exists must_change_password boolean not null default false;

alter table public.profiles drop constraint if exists profiles_court_chk;
alter table public.profiles add constraint profiles_court_chk check (court in (1, 2));

create index if not exists profiles_role_id_idx on public.profiles (role_id);

-- Rol de alcance 'court' → juzgado obligatorio; alcance 'all' o sin rol → sin juzgado.
create or replace function public.profiles_check_court()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_scope text;
begin
  if new.role_id is null then
    if new.court is not null then
      raise exception 'court_without_role' using hint = 'Un perfil sin rol no lleva juzgado.';
    end if;
    return new;
  end if;

  select scope into v_scope from public.roles where id = new.role_id;
  if v_scope = 'court' and new.court is null then
    raise exception 'court_required' using hint = 'Este rol requiere un juzgado.';
  end if;
  if v_scope = 'all' and new.court is not null then
    raise exception 'court_not_allowed' using hint = 'Este rol aplica a los dos juzgados: no lleva juzgado.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_check_court on public.profiles;
create trigger profiles_check_court
  before insert or update of role_id, court on public.profiles
  for each row execute function public.profiles_check_court();

-- ---------------------------------------------------------------------------------------------
-- Protecciones.
-- ---------------------------------------------------------------------------------------------

-- No quedarse sin superadmin: no se puede quitar el rol, desactivar ni borrar al último activo.
create or replace function public.profiles_keep_last_superadmin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_superadmin uuid;
begin
  select id into v_superadmin from public.roles where code = 'superadmin';

  if old.role_id is distinct from v_superadmin or not old.active then
    return coalesce(new, old);
  end if;
  if tg_op = 'UPDATE' and new.role_id = v_superadmin and new.active then
    return new;
  end if;

  if not exists (
    select 1 from public.profiles
    where role_id = v_superadmin and active and id <> old.id
  ) then
    raise exception 'last_superadmin' using hint = 'Debe quedar al menos un superadmin activo.';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists profiles_keep_last_superadmin on public.profiles;
create trigger profiles_keep_last_superadmin
  before update of role_id, active or delete on public.profiles
  for each row execute function public.profiles_keep_last_superadmin();

-- Roles del sistema (superadmin): ni se editan ni se borran ni reciben permisos.
-- Un rol con usuarios no cambia de alcance (dejaría juzgados inconsistentes).
create or replace function public.roles_protect()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.is_system then
    raise exception 'system_role' using hint = 'Este rol del sistema no se puede modificar.';
  end if;
  if tg_op = 'UPDATE' then
    if new.is_system or new.code <> old.code then
      raise exception 'system_role' using hint = 'El código y el tipo de rol no se pueden cambiar.';
    end if;
    if new.scope <> old.scope and exists (select 1 from public.profiles where role_id = old.id) then
      raise exception 'role_in_use' using hint = 'No se puede cambiar el alcance de un rol con usuarios.';
    end if;
    return new;
  end if;
  return old;
end;
$$;

drop trigger if exists roles_protect on public.roles;
create trigger roles_protect
  before update or delete on public.roles
  for each row execute function public.roles_protect();

create or replace function public.role_permissions_protect()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (select 1 from public.roles where id = coalesce(new.role_id, old.role_id) and is_system) then
    raise exception 'system_role' using hint = 'Este rol del sistema ya tiene todos los permisos.';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists role_permissions_protect on public.role_permissions;
create trigger role_permissions_protect
  before insert or update or delete on public.role_permissions
  for each row execute function public.role_permissions_protect();

-- ---------------------------------------------------------------------------------------------
-- Funciones de acceso.
-- ---------------------------------------------------------------------------------------------

-- ¿El usuario en sesión puede hacer p_permission (sobre el juzgado p_court)? Base de todas las
-- políticas. security definer para no depender de las políticas de roles / role_permissions;
-- solo mira la fila del propio usuario (auth.uid()). Para datos de un juzgado, pasar siempre
-- su court: con p_court null un rol de alcance 'court' no se limita a su juzgado.
create or replace function public.has_permission(p_permission text, p_court smallint default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case
      when r.code = 'superadmin' then true
      when not exists (
        select 1 from public.role_permissions rp
        where rp.role_id = r.id and rp.permission_code = p_permission
      ) then false
      when p_court is not null and r.scope = 'court' then p.court = p_court
      else true
    end
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = (select auth.uid()) and p.active
  ), false);
$$;

-- Acceso del usuario en sesión, para armar el menú y ocultar botones (la protección real son
-- las políticas). null si no tiene perfil.
create or replace function public.get_my_access()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'role', r.code,
    'role_name', r.name,
    'scope', r.scope,
    'court', p.court,
    'active', p.active,
    'must_change_password', p.must_change_password,
    'permissions', case
      when r.code = 'superadmin' then
        (select coalesce(jsonb_agg(code order by code), '[]'::jsonb) from public.permissions)
      else
        (select coalesce(jsonb_agg(permission_code order by permission_code), '[]'::jsonb)
         from public.role_permissions where role_id = r.id)
    end
  )
  from public.profiles p
  left join public.roles r on r.id = p.role_id
  where p.id = (select auth.uid());
$$;

-- Mi perfil la llama tras cambiar la contraseña. Ayuda de flujo, no barrera de seguridad: quien
-- la llame sin cambiarla solo se salta el aviso.
create or replace function public.complete_password_change()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles set must_change_password = false where id = (select auth.uid());
$$;

revoke execute on function public.has_permission(text, smallint) from public, anon;
revoke execute on function public.get_my_access() from public, anon;
revoke execute on function public.complete_password_change() from public, anon;
grant execute on function public.has_permission(text, smallint) to authenticated;
grant execute on function public.get_my_access() to authenticated;
grant execute on function public.complete_password_change() to authenticated;

-- Funciones de triggers: no se llaman por RPC.
revoke execute on function public.profiles_keep_last_superadmin() from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- RLS.
-- ---------------------------------------------------------------------------------------------
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;

revoke all on table public.permissions, public.roles, public.role_permissions from anon;
revoke all on table public.permissions, public.roles, public.role_permissions from authenticated;
grant select on table public.permissions, public.roles, public.role_permissions to authenticated;
-- Permisos: solo nombre y descripción (los códigos nacen en las migraciones).
grant update (name, description) on table public.permissions to authenticated;
-- Roles: crear, editar nombre / descripción / alcance y borrar.
grant insert (code, name, description, scope) on table public.roles to authenticated;
grant update (name, description, scope) on table public.roles to authenticated;
grant delete on table public.roles to authenticated;
grant insert, delete on table public.role_permissions to authenticated;

drop policy if exists permissions_select on public.permissions;
create policy permissions_select on public.permissions
  for select to authenticated using (true);

drop policy if exists permissions_update on public.permissions;
create policy permissions_update on public.permissions
  for update to authenticated
  using ((select public.has_permission('permisos.gestionar')))
  with check ((select public.has_permission('permisos.gestionar')));

drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles
  for select to authenticated using (true);

drop policy if exists roles_insert on public.roles;
create policy roles_insert on public.roles
  for insert to authenticated
  with check ((select public.has_permission('roles.gestionar')));

drop policy if exists roles_update on public.roles;
create policy roles_update on public.roles
  for update to authenticated
  using ((select public.has_permission('roles.gestionar')))
  with check ((select public.has_permission('roles.gestionar')));

drop policy if exists roles_delete on public.roles;
create policy roles_delete on public.roles
  for delete to authenticated
  using ((select public.has_permission('roles.gestionar')));

drop policy if exists role_permissions_select on public.role_permissions;
create policy role_permissions_select on public.role_permissions
  for select to authenticated using (true);

drop policy if exists role_permissions_insert on public.role_permissions;
create policy role_permissions_insert on public.role_permissions
  for insert to authenticated
  with check ((select public.has_permission('roles.gestionar')));

drop policy if exists role_permissions_delete on public.role_permissions;
create policy role_permissions_delete on public.role_permissions
  for delete to authenticated
  using ((select public.has_permission('roles.gestionar')));

-- ---------------------------------------------------------------------------------------------
-- Datos iniciales.
-- ---------------------------------------------------------------------------------------------
insert into public.permissions (code, module, name, description) values
  ('usuarios.ver', 'usuarios', 'Ver usuarios', 'Ver la lista de usuarios del dashboard.'),
  ('usuarios.gestionar', 'usuarios', 'Gestionar usuarios', 'Crear, editar, desactivar y reactivar usuarios.'),
  ('roles.ver', 'roles', 'Ver roles', 'Ver los roles y sus permisos.'),
  ('roles.gestionar', 'roles', 'Gestionar roles', 'Crear, editar y borrar roles, y asignar sus permisos.'),
  ('permisos.ver', 'permisos', 'Ver permisos', 'Ver el catálogo de permisos.'),
  ('permisos.gestionar', 'permisos', 'Editar permisos', 'Editar el nombre y la descripción de los permisos.')
on conflict (code) do nothing;

insert into public.roles (code, name, description, scope, is_system) values
  ('superadmin', 'Superadmin', 'Acceso total al dashboard, incluidos usuarios, roles y permisos.', 'all', true),
  ('juzgado', 'Juzgado', 'Usuarios de un juzgado: gestionan lo que corresponde a su juzgado.', 'court', false),
  ('oficina', 'Oficina', 'Usuarios de la oficina: ven los dos juzgados y editan lo que se les permita.', 'all', false)
on conflict (code) do nothing;

-- Primer superadmin: la cuenta del propietario (ya registrada en Supabase Auth).
do $$
declare
  v_user uuid;
  v_role uuid;
begin
  select id into v_user from auth.users where lower(email) = 'gaguilah@gmail.com';
  if v_user is null then
    raise exception 'No existe en auth.users la cuenta del primer superadmin (gaguilah@gmail.com).';
  end if;

  select id into v_role from public.roles where code = 'superadmin';

  insert into public.profiles (id, role_id, court, active)
  values (v_user, v_role, null, true)
  on conflict (id) do update
    set role_id = excluded.role_id, court = null, active = true;
end;
$$;
