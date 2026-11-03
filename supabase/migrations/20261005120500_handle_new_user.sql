-- Perfil automático al crear una cuenta de Auth.
--
-- La función y el trigger ya existían en Supabase, creados a mano (sin migración), como la tabla
-- profiles (ver 20261005120000_profiles.sql). Esta migración los copia tal como están en producción
-- (2026-11-03), para que una base nueva (pruebas pgTAP, docs/plan-pruebas.md, Fase 4) quede igual.
-- Es idempotente: en producción no cambia nada.
--
-- search_path vacío y EXECUTE revocado: 20261103120000_security_cleanup.sql.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
