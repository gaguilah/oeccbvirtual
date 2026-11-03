-- Encuestas (migraciones 20260930120000_submit_survey_response.sql, 20260930200302_create_survey_tables.sql
-- y 20261008120000_surveys_admin.sql; docs/plan-encuestas-dashboard.md). El front repite el tipo y el
-- rango en src/components/survey/validation.ts: cambiar los dos juntos.
begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

select tests.create_role('prueba_encuestas_ver', 'all', array['encuestas.ver']);
select tests.create_role('prueba_encuestas_gestion', 'all', array['encuestas.ver', 'encuestas.gestionar']);
select tests.create_role('prueba_sin_encuestas', 'all', array['remates.ver']);
select tests.create_user('lector@prueba.test', 'prueba_encuestas_ver');
select tests.create_user('gestor@prueba.test', 'prueba_encuestas_gestion');
select tests.create_user('ajeno@prueba.test', 'prueba_sin_encuestas');

-- Una activa y una inactiva (como postgres).
insert into public.surveys (id, code, title, is_active) values
  ('00000000-0000-0000-0000-0000000000e1', 'activa', 'Encuesta activa', true),
  ('00000000-0000-0000-0000-0000000000e2', 'inactiva', 'Encuesta inactiva', false);
insert into public.survey_questions (id, survey_id, code, position, text, type, scale_min, scale_max, min_label, max_label, is_required) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 'p1', 1, '¿Le atendieron?', 'yes_no', null, null, null, null, true),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000e1', 'p2', 2, 'Califique', 'scale', 1, 5, 'Mal', 'Bien', false),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000e2', 'p1', 1, 'Otra pregunta', 'yes_no', null, null, null, null, true);

create function pg_temp.answer(p_question text, p_value jsonb) returns jsonb language sql as
  $$ select jsonb_build_object('questionId', '00000000-0000-0000-0000-0000000000' || p_question, 'value', p_value) $$;

-- Público -------------------------------------------------------------------------------------------
select tests.login_as_anon();
select results_eq($$ select code from public.surveys $$, $$ values ('activa') $$, 'el público solo ve la encuesta activa');
select is((select count(*)::int from public.survey_questions), 2, 'y solo sus preguntas');
select throws_ok(
  $$ select public.submit_survey_response('00000000-0000-0000-0000-0000000000e1', '[]') $$,
  '42501', null,
  'el público no llama submit_survey_response (solo submit-survey, con captcha)'
);
select throws_ok($$ select * from public.survey_responses $$, '42501', null, 'el público no lee las respuestas');
select throws_ok(
  $$ insert into public.survey_responses (survey_id) values ('00000000-0000-0000-0000-0000000000e1') $$,
  '42501', null,
  'ni las escribe directamente'
);

select tests.login_as('gestor@prueba.test');
select throws_ok(
  $$ select public.submit_survey_response('00000000-0000-0000-0000-0000000000e1', '[]') $$,
  '42501', null,
  'un usuario con sesión tampoco'
);

-- submit_survey_response (como service_role lo hace submit-survey; aquí como postgres) ----------------
select tests.logout();
select lives_ok(
  format($$ select public.submit_survey_response('00000000-0000-0000-0000-0000000000e1', %L) $$,
         jsonb_build_array(pg_temp.answer('f1', 'true'), pg_temp.answer('f2', '4'))),
  'guarda una respuesta válida'
);
select results_eq(
  $$ select a.value from public.survey_answers a join public.survey_questions q on q.id = a.question_id order by q.position $$,
  $$ values (1::smallint), (4::smallint) $$,
  'sí se guarda como 1 y la escala con su número'
);
select throws_ok(
  format($$ select public.submit_survey_response('00000000-0000-0000-0000-0000000000e2', %L) $$,
         jsonb_build_array(pg_temp.answer('f3', 'true'))),
  'P0001', 'survey_not_available', 'no a una encuesta inactiva'
);
select throws_ok(
  $$ select public.submit_survey_response('00000000-0000-0000-0000-0000000000e1', '[]') $$,
  'P0001', 'invalid_answers', 'no sin respuestas'
);
select throws_ok(
  format($$ select public.submit_survey_response('00000000-0000-0000-0000-0000000000e1', %L) $$,
         jsonb_build_array(pg_temp.answer('f1', 'true'), pg_temp.answer('f2', '9'))),
  'P0001', 'invalid_answers', 'no fuera del rango de la escala'
);
select throws_ok(
  format($$ select public.submit_survey_response('00000000-0000-0000-0000-0000000000e1', %L) $$,
         jsonb_build_array(pg_temp.answer('f1', 'true'), pg_temp.answer('f2', '2.5'))),
  'P0001', 'invalid_answers', 'no con decimales en la escala'
);
select throws_ok(
  format($$ select public.submit_survey_response('00000000-0000-0000-0000-0000000000e1', %L) $$,
         jsonb_build_array(pg_temp.answer('f1', '1'))),
  'P0001', 'invalid_answers', 'sí/no exige un booleano'
);
select throws_ok(
  format($$ select public.submit_survey_response('00000000-0000-0000-0000-0000000000e1', %L) $$,
         jsonb_build_array(pg_temp.answer('f1', 'true'), pg_temp.answer('f3', 'true'))),
  'P0001', 'invalid_answers', 'no con preguntas de otra encuesta'
);
select throws_ok(
  format($$ select public.submit_survey_response('00000000-0000-0000-0000-0000000000e1', %L) $$,
         jsonb_build_array(pg_temp.answer('f1', 'true'), pg_temp.answer('f1', 'false'))),
  '23505', null, 'no la misma pregunta dos veces'
);
select throws_ok(
  format($$ select public.submit_survey_response('00000000-0000-0000-0000-0000000000e1', %L) $$,
         jsonb_build_array(pg_temp.answer('f2', '3'))),
  'P0001', 'missing_required_answers', 'no sin las preguntas obligatorias'
);
select throws_ok(
  $$ update public.surveys set is_active = true where code = 'inactiva' $$,
  '23505', null, 'solo una encuesta activa a la vez'
);

-- Dashboard -----------------------------------------------------------------------------------------
select tests.login_as('ajeno@prueba.test');
select throws_ok(
  $$ select public.survey_stats('00000000-0000-0000-0000-0000000000e1', current_date - 1, current_date + 1) $$,
  '42501', 'forbidden', 'survey_stats exige encuestas.ver'
);

select tests.login_as('lector@prueba.test');
select is(
  (public.survey_stats('00000000-0000-0000-0000-0000000000e1', current_date - 1, current_date + 1) ->> 'total')::int,
  1,
  'survey_stats cuenta las respuestas del periodo'
);
select is((select count(*)::int from public.surveys), 2, 'con encuestas.ver ve también las inactivas');
select throws_ok(
  $$ select public.set_active_survey('00000000-0000-0000-0000-0000000000e2', true) $$,
  '42501', 'forbidden', 'sin encuestas.gestionar no activa'
);

select tests.login_as('gestor@prueba.test');
select lives_ok(
  $$ select public.set_active_survey('00000000-0000-0000-0000-0000000000e2', true) $$,
  'set_active_survey cambia la activa'
);
select results_eq(
  $$ select code from public.surveys where is_active $$, $$ values ('inactiva') $$,
  'y desactiva la anterior'
);
select throws_ok(
  $$ update public.survey_questions set type = 'scale', scale_min = 1, scale_max = 5, min_label = 'a', max_label = 'b'
     where id = '00000000-0000-0000-0000-0000000000f2' $$,
  '42501', null,
  'con respuestas, la estructura no cambia (ni siquiera hay grant para el tipo)'
);
select lives_ok(
  $$ update public.survey_questions set text = '¿Le atendieron bien?' where id = '00000000-0000-0000-0000-0000000000f1' $$,
  'con respuestas, sí se corrigen los textos'
);
select throws_ok(
  $$ select public.save_survey('00000000-0000-0000-0000-0000000000e1', 'activa', 'Encuesta activa',
       '[{"id": "00000000-0000-0000-0000-0000000000f1", "code": "p1", "text": "¿Le atendieron?", "type": "yes_no"}]') $$,
  'P0001', 'survey_locked', 'save_survey no quita preguntas de una encuesta con respuestas'
);
select throws_ok(
  $$ delete from public.surveys where id = '00000000-0000-0000-0000-0000000000e1' $$,
  null, null, 'una encuesta con respuestas no se borra'
);

select tests.logout();
select throws_ok(
  $$ update public.survey_questions set position = 3 where id = '00000000-0000-0000-0000-0000000000f2' $$,
  'P0001', 'survey_locked', 'el trigger guardián frena cambios de estructura también sin RLS'
);

select * from finish();
rollback;
