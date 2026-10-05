-- Usuarios, roles y permisos: fase 2 (docs/plan-usuarios.md).
--
-- list_users(): lista para la sección Usuarios. Los correos y el último ingreso viven en
-- auth.users, que el navegador no puede leer; por eso una función security definer que primero
-- exige usuarios.ver. Incluye las cuentas de Auth sin perfil (aparecen "Sin rol" para asignarles
-- uno). Las altas y cambios los hace la Edge Function manage-users con la service role key.

create or replace function public.list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  role_id uuid,
  role_code text,
  role_name text,
  scope text,
  court smallint,
  active boolean,
  must_change_password boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_permission('usuarios.ver') then
    raise exception 'forbidden' using errcode = '42501', hint = 'Requiere el permiso usuarios.ver.';
  end if;

  return query
    select
      u.id,
      u.email::text,
      p.full_name,
      p.role_id,
      r.code,
      r.name,
      r.scope,
      p.court,
      coalesce(p.active, true),
      coalesce(p.must_change_password, false),
      u.created_at,
      u.last_sign_in_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.roles r on r.id = p.role_id
    order by p.full_name nulls last, u.email;
end;
$$;

revoke execute on function public.list_users() from public, anon;
grant execute on function public.list_users() to authenticated;
