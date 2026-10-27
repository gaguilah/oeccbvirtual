-- Permisos explícitos para service_role (las Edge Functions).
--
-- Supabase dejó de dar permisos automáticos a anon, authenticated y service_role sobre las tablas
-- nuevas del esquema public (aviso recibido en octubre de 2026). Las tablas que ya existen conservan los que
-- tenían, así que en producción esta migración no cambia nada: service_role ya tiene todos.
--
-- Hasta ahora las migraciones daban permisos explícitos a anon y authenticated (solo lo necesario,
-- casi siempre por columna) pero dependían de los automáticos para service_role. Las Edge
-- Functions escriben con service_role en email_log, request_counters, hearing_notifications,
-- hearing_weekly_sends, survey_responses y survey_answers, y leen o escriben en las demás. Sin esta
-- migración, una base recreada desde el repositorio (proyecto nuevo, copia de prueba, recuperación)
-- dejaría sin funcionar los correos, los radicados de PQRS y la encuesta.
--
-- Da a service_role lo mismo que daban los permisos automáticos (all), sobre las tablas y las
-- secuencias que existen hoy. No toca anon ni authenticated, ni las políticas RLS (service_role las
-- omite, como siempre). Las tablas nuevas deben traer sus propios grants (CLAUDE.md, "Table
-- grants"). Idempotente: volver a correrla no cambia nada.

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
