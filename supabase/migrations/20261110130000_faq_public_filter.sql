-- Preguntas frecuentes: la página pública filtra por is_published (docs/plan-preguntas-frecuentes.md).
--
-- Con sesión de un funcionario con preguntas.ver, la política faq_questions_select_dashboard también
-- deja ver las ocultas, y la página pública usa la misma sesión: las mostraba. La página pide ahora
-- is_published = true, y para eso anon necesita leer esa columna. No expone nada: anon solo ve filas
-- publicadas (faq_questions_select_public).
grant select (is_published) on table public.faq_questions to anon;
