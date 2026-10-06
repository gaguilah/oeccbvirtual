-- Configuración de perfil (/dashboard/perfil): cada usuario puede cambiar su propio nombre.
--
-- Solo la columna full_name: el privilegio de update se da por columna, así una columna que se
-- agregue después (p. ej. el rol, en el plan de Usuarios, roles y permisos) no se puede cambiar
-- desde el navegador aunque la política permita actualizar la fila propia. updated_at lo pone el
-- trigger profiles_set_updated_at. Sin insert: las filas las crea el plan de Usuarios.

grant update (full_name) on table public.profiles to authenticated;

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
