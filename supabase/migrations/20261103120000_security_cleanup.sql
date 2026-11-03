-- Limpieza de permisos (docs/plan-seguridad-supabase.md, Fase 1).
--
-- Las tablas creadas antes de octubre de 2026 recibieron los permisos automáticos de Supabase para
-- anon y authenticated. Las migraciones de cada sección quitaron después los de escritura que no se
-- usan, pero quedaron algunos: la RLS los frena, aunque así es la única barrera. Esta migración los quita.
-- No toca los SELECT, INSERT, UPDATE y DELETE (por tabla o por columna) que usa el navegador, ni
-- service_role (las Edge Functions), ni las políticas. Idempotente: volver a correrla no cambia nada.

-- 1. Encuesta: solo la escribe submit_survey_response() con service_role; el navegador no la toca.
revoke all on table public.survey_responses, public.survey_answers from anon, authenticated;

-- 2. Permisos que ninguna pantalla usa, en todas las tablas: vaciar (TRUNCATE no pasa por la RLS),
--    crear triggers, referencias de claves foráneas y mantenimiento. Las secuencias son de columnas
--    identity, que no necesitan permisos en la secuencia para insertar.
revoke truncate, references, trigger, maintain on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- 3. Funciones de trigger: nadie las llama por /rest/v1/rpc. Los triggers siguen funcionando, porque
--    el permiso EXECUTE se revisa al crear el trigger, no cada vez que se dispara.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.profiles_set_updated_at() from public, anon, authenticated;
revoke execute on function public.profiles_check_court() from public, anon, authenticated;
revoke execute on function public.roles_protect() from public, anon, authenticated;
revoke execute on function public.role_permissions_protect() from public, anon, authenticated;
revoke execute on function public.survey_questions_guard() from public, anon, authenticated;
revoke execute on function public.profile_personal_info_section_dates() from public, anon, authenticated;

-- handle_new_user es security definer: search_path vacío, como las demás. Su cuerpo ya usa
-- public.profiles con el esquema.
alter function public.handle_new_user() set search_path = '';
