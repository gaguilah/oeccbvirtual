-- Preguntas frecuentes (docs/plan-preguntas-frecuentes.md, migración 20261110120000_faq.sql).
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

select tests.create_role('prueba_preguntas_ver', 'all', array['preguntas.ver']);
select tests.create_role('prueba_preguntas_gestion', 'all', array['preguntas.ver', 'preguntas.gestionar']);
select tests.create_user('lector@prueba.test', 'prueba_preguntas_ver');
select tests.create_user('gestor@prueba.test', 'prueba_preguntas_gestion');

-- Datos de prueba (como postgres, sin RLS). El trigger pone el orden.
insert into public.faq_sections (slug, title) values ('seccion-uno', 'Sección uno'), ('seccion-dos', 'Sección dos');
insert into public.faq_questions (section_id, question, answer, is_published)
select s.id, q.question, 'Respuesta de prueba.', q.published
from public.faq_sections s
cross join (values ('¿Pregunta publicada?', true), ('¿Pregunta oculta?', false)) as q (question, published)
where s.slug = 'seccion-uno';

select results_eq(
  $$ select question, position from public.faq_questions order by position $$,
  $$ values ('¿Pregunta publicada?', 1), ('¿Pregunta oculta?', 2) $$,
  'cada pregunta nueva queda al final de su sección'
);
select throws_ok(
  $$ insert into public.faq_questions (section_id, question, answer)
     select id, ' ¿Con espacios al inicio?', 'Respuesta de prueba.' from public.faq_sections limit 1 $$,
  '23514', null,
  'la pregunta no puede tener espacios al inicio ni al final'
);
select throws_ok(
  $$ insert into public.faq_sections (slug, title) values ('Con Mayúsculas', 'Sección mal') $$,
  '23514', null,
  'el slug solo lleva minúsculas, números y guiones'
);

-- Público.
select tests.login_as_anon();
select is((select count(*)::int from public.faq_sections), 2, 'el público lee las secciones');
select is(
  (select count(*)::int from public.faq_questions),
  1,
  'el público solo ve las preguntas publicadas'
);
select throws_ok(
  $$ select created_by from public.faq_questions $$,
  '42501', null,
  'el público no lee el autor'
);
select throws_ok(
  $$ select updated_at from public.faq_questions $$,
  '42501', null,
  'el público solo lee las columnas que muestra la página (y is_published, para filtrar)'
);
select throws_ok(
  $$ insert into public.faq_sections (slug, title) values ('otra', 'Otra sección') $$,
  '42501', null,
  'el público no escribe'
);

-- Solo ver.
select tests.login_as('lector@prueba.test');
select is((select count(*)::int from public.faq_questions), 2, 'con preguntas.ver ve también las ocultas');
select is(
  (select count(*)::int from public.faq_questions where is_published),
  1,
  'la consulta de la página pública (is_published = true) solo trae las publicadas, también con sesión'
);
select throws_ok(
  $$ insert into public.faq_questions (section_id, question, answer)
     select id, '¿Pregunta del lector?', 'Respuesta de prueba.' from public.faq_sections limit 1 $$,
  '42501', null,
  'sin preguntas.gestionar no crea preguntas'
);
select throws_ok(
  $$ select public.move_faq_question((select min(id) from public.faq_questions), false) $$,
  '42501', null,
  'sin preguntas.gestionar no reordena'
);
update public.faq_questions set is_published = true where not is_published;
select is(
  (select count(*)::int from public.faq_questions where is_published),
  1,
  'sin preguntas.gestionar no publica (el UPDATE no toca ninguna fila)'
);

-- Gestionar.
select tests.login_as('gestor@prueba.test');
select lives_ok(
  $$ insert into public.faq_questions (section_id, question, answer)
     select id, '¿Pregunta del gestor?', 'Respuesta de prueba.' from public.faq_sections where slug = 'seccion-uno' $$,
  'con preguntas.gestionar crea preguntas'
);
select tests.logout();
select results_eq(
  $$ select position, is_published, created_by = tests.user_id('gestor@prueba.test')
     from public.faq_questions where question = '¿Pregunta del gestor?' $$,
  $$ values (3, false, true) $$,
  'la pregunta nueva queda al final, oculta y con su autor'
);

select tests.login_as('gestor@prueba.test');
select lives_ok(
  $$ select public.move_faq_question((select id from public.faq_questions where question = '¿Pregunta del gestor?'), true) $$,
  'sube una pregunta'
);
select results_eq(
  $$ select question from public.faq_questions order by position $$,
  $$ values ('¿Pregunta publicada?'), ('¿Pregunta del gestor?'), ('¿Pregunta oculta?') $$,
  'y queda encima de su vecina'
);
select lives_ok(
  $$ select public.move_faq_section((select id from public.faq_sections where slug = 'seccion-dos'), true) $$,
  'sube una sección'
);
select results_eq(
  $$ select slug from public.faq_sections order by position $$,
  $$ values ('seccion-dos'), ('seccion-uno') $$,
  'y queda primera'
);
select throws_ok(
  $$ update public.faq_sections set slug = 'nuevo' where slug = 'seccion-uno' $$,
  '42501', null,
  'el slug de una sección no cambia'
);
select throws_ok(
  $$ delete from public.faq_sections where slug = 'seccion-uno' $$,
  '23503', null,
  'una sección con preguntas no se elimina'
);

select * from finish();
rollback;
