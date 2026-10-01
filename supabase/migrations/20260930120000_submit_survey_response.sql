-- =========================================================
-- Registro atómico de una encuesta diligenciada
-- =========================================================
-- Todo lo que ocurre dentro de la función es una única transacción: si cualquier
-- validación o insert falla, PostgreSQL deshace el envío completo (no quedan
-- envíos sin respuestas).
--
-- Solo la Edge Function `submit-survey` (service_role, tras verificar Turnstile)
-- puede ejecutarla. Medidas de seguridad:
--   1. EXECUTE revocado a public / anon / authenticated; concedido solo a service_role.
--   2. SECURITY INVOKER: se ejecuta con los permisos de quien llama. Aunque el permiso
--      quedara abierto por error, anon chocaría con RLS (las tablas no tienen políticas).
--   3. search_path vacío y nombres calificados: evita suplantación de objetos.
--
-- p_answers: arreglo JSON [{ "questionId": uuid, "value": boolean | integer }]
--   yes_no → boolean (se guarda 1 = sí, 0 = no)
--   scale  → entero dentro de [scale_min, scale_max]
--
-- Errores (message) que interpreta la Edge Function:
--   survey_not_available · invalid_answers · missing_required_answers
--   (una pregunta repetida produce unique_violation, código 23505)

create or replace function public.submit_survey_response(p_survey_id uuid, p_answers jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_response_id uuid;
  v_inserted    integer;
begin
  -- La encuesta debe existir y estar activa.
  if not exists (
    select 1 from public.surveys s
    where s.id = p_survey_id and s.is_active
  ) then
    raise exception using errcode = 'P0001', message = 'survey_not_available';
  end if;

  if p_answers is null
     or jsonb_typeof(p_answers) <> 'array'
     or jsonb_array_length(p_answers) = 0 then
    raise exception using errcode = 'P0001', message = 'invalid_answers';
  end if;

  insert into public.survey_responses (survey_id)
  values (p_survey_id)
  returning id into v_response_id;

  -- Solo se insertan respuestas de preguntas de esta encuesta con un valor válido
  -- para su tipo. Las demás quedan fuera y se detectan al comparar el conteo.
  insert into public.survey_answers (response_id, question_id, value)
  select v_response_id, checked.question_id, checked.value
  from (
    select
      q.id as question_id,
      case
        when q.type = 'yes_no' and jsonb_typeof(e -> 'value') = 'boolean' then
          case when (e -> 'value')::boolean then 1 else 0 end
        when q.type = 'scale'
             and jsonb_typeof(e -> 'value') = 'number'
             and (e -> 'value')::numeric = trunc((e -> 'value')::numeric)
             and (e -> 'value')::numeric between q.scale_min and q.scale_max then
          (e -> 'value')::numeric::smallint
      end as value
    from jsonb_array_elements(p_answers) as e
    join public.survey_questions q
      on q.id::text = e ->> 'questionId'
     and q.survey_id = p_survey_id
  ) as checked
  where checked.value is not null;

  get diagnostics v_inserted = row_count;

  -- Alguna respuesta era de otra encuesta, de una pregunta inexistente o tenía un valor inválido.
  if v_inserted <> jsonb_array_length(p_answers) then
    raise exception using errcode = 'P0001', message = 'invalid_answers';
  end if;

  -- Todas las preguntas obligatorias deben tener respuesta.
  if exists (
    select 1
    from public.survey_questions q
    where q.survey_id = p_survey_id
      and q.is_required
      and not exists (
        select 1 from public.survey_answers a
        where a.response_id = v_response_id and a.question_id = q.id
      )
  ) then
    raise exception using errcode = 'P0001', message = 'missing_required_answers';
  end if;

  return v_response_id;
end;
$$;

-- Medida 1: nadie más que service_role puede ejecutarla (tampoco vía /rest/v1/rpc).
revoke all on function public.submit_survey_response(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.submit_survey_response(uuid, jsonb) to service_role;

comment on function public.submit_survey_response(uuid, jsonb) is
  'Registra una encuesta diligenciada de forma atómica. Solo la invoca la Edge Function submit-survey (service_role) tras verificar Turnstile.';
