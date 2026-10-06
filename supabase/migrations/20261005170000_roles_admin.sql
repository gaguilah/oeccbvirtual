-- Usuarios, roles y permisos: fase 3, sección Roles (docs/plan-usuarios.md).
--
-- list_roles(): roles con su número de usuarios y de permisos. security definer porque contar
-- usuarios exige leer profiles de otros (su política solo deja leer la fila propia); primero exige
-- roles.ver.
--
-- save_role(): crea o edita un rol y deja exactamente los permisos indicados, en una sola
-- transacción (no queda un rol a medio guardar). security invoker: corre como quien la llama, así
-- se aplican los grants por columna, las políticas (roles.gestionar) y los triggers de la fase 1
-- (rol del sistema, alcance de un rol con usuarios).

create or replace function public.list_roles()
returns table (
  id uuid,
  code text,
  name text,
  description text,
  scope text,
  is_system boolean,
  user_count bigint,
  permission_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_permission('roles.ver') then
    raise exception 'forbidden' using errcode = '42501', hint = 'Requiere el permiso roles.ver.';
  end if;

  return query
    select
      r.id,
      r.code,
      r.name,
      r.description,
      r.scope,
      r.is_system,
      (select count(*) from public.profiles p where p.role_id = r.id),
      case
        when r.is_system then (select count(*) from public.permissions)
        else (select count(*) from public.role_permissions rp where rp.role_id = r.id)
      end
    from public.roles r
    order by r.is_system desc, r.name;
end;
$$;

create or replace function public.save_role(
  p_id uuid,
  p_code text,
  p_name text,
  p_description text,
  p_scope text,
  p_permissions text[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_permissions text[] := coalesce(p_permissions, '{}');
begin
  if not public.has_permission('roles.gestionar') then
    raise exception 'forbidden' using errcode = '42501', hint = 'Requiere el permiso roles.gestionar.';
  end if;
  if p_name is null or char_length(trim(p_name)) not between 3 and 60 then
    raise exception 'invalid_name' using hint = 'El nombre debe tener entre 3 y 60 caracteres.';
  end if;

  if p_id is null then
    insert into public.roles (code, name, description, scope)
    values (p_code, trim(p_name), nullif(trim(p_description), ''), p_scope)
    returning id into v_id;
  else
    update public.roles
       set name = trim(p_name),
           description = nullif(trim(p_description), ''),
           scope = p_scope
     where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'role_not_found' using hint = 'El rol no existe o no tiene permiso para editarlo.';
    end if;
  end if;

  delete from public.role_permissions
   where role_id = v_id and not (permission_code = any (v_permissions));

  insert into public.role_permissions (role_id, permission_code)
  select v_id, code from unnest(v_permissions) as code
  on conflict do nothing;

  return v_id;
end;
$$;

revoke execute on function public.list_roles() from public, anon;
revoke execute on function public.save_role(uuid, text, text, text, text, text[]) from public, anon;
grant execute on function public.list_roles() to authenticated;
grant execute on function public.save_role(uuid, text, text, text, text, text[]) to authenticated;
