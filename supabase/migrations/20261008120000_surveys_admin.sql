-- Encuestas en el dashboard: resultados (solo agregados) y gestión (docs/plan-encuestas-dashboard.md).
--
-- encuestas.ver: ver las encuestas (también las inactivas), sus preguntas y los resultados.
--   Inicialmente oficina y director_oficina; juzgado no.
-- encuestas.gestionar: crear, editar, activar / desactivar y eliminar encuestas. Solo superadmin
--   (implícito) hasta que lo asigne a otro rol en Roles.
--
-- survey_responses y survey_answers siguen sin políticas: nadie las lee desde el navegador. Los
-- resultados salen de funciones security definer que devuelven solo conteos.

-- ---------------------------------------------------------------------------------------------
-- Una sola encuesta activa (la que muestra /encuesta). Si esta línea falla, hay más de una activa:
-- desactive las sobrantes en el Table Editor y vuelva a correr la migración.
-- ---------------------------------------------------------------------------------------------
create unique index if not exists surveys_single_active_idx on public.surveys ((true)) where is_active;

-- Las encuestas nuevas nacen inactivas: se activan desde la lista (set_active_survey).
alter table public.surveys alter column is_active set default false;

alter table public.surveys drop constraint if exists surveys_title_chk;
alter table public.surveys add constraint surveys_title_chk
  check (char_length(trim(title)) between 3 and 120) not valid;

alter table public.surveys drop constraint if exists surveys_code_format;
alter table public.surveys add constraint surveys_code_format
  check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$') not valid;

create index if not exists survey_responses_survey_created_idx
  on public.survey_responses (survey_id, created_at);

-- ---------------------------------------------------------------------------------------------
-- Privilegios: el navegador solo escribe las columnas necesarias; las políticas exigen el permiso.
-- El código de la encuesta y la estructura de las preguntas no se editan (se reemplazan con
-- save_survey mientras no haya respuestas).
-- ---------------------------------------------------------------------------------------------
revoke insert, update, delete on table public.surveys from anon, authenticated;
revoke insert, update, delete on table public.survey_questions from anon, authenticated;
grant select on table public.surveys, public.survey_questions to anon, authenticated;
grant insert (code, title) on table public.surveys to authenticated;
grant update (title, is_active) on table public.surveys to authenticated;
grant delete on table public.surveys to authenticated;
grant insert (id, survey_id, code, position, text, help_text, type, scale_min, scale_max, min_label, max_label, is_required)
  on table public.survey_questions to authenticated;
grant update (text, help_text, min_label, max_label) on table public.survey_questions to authenticated;
grant delete on table public.survey_questions to authenticated;

-- Lectura en el dashboard (también encuestas inactivas). Las políticas públicas de las activas
-- siguen igual; las de select se suman (OR).
drop policy if exists surveys_select_dashboard on public.surveys;
create policy surveys_select_dashboard on public.surveys
  for select to authenticated using ((select public.has_permission('encuestas.ver')));

drop policy if exists survey_questions_select_dashboard on public.survey_questions;
create policy survey_questions_select_dashboard on public.survey_questions
  for select to authenticated using ((select public.has_permission('encuestas.ver')));

drop policy if exists surveys_insert on public.surveys;
create policy surveys_insert on public.surveys
  for insert to authenticated with check ((select public.has_permission('encuestas.gestionar')));

drop policy if exists surveys_update on public.surveys;
create policy surveys_update on public.surveys
  for update to authenticated
  using ((select public.has_permission('encuestas.gestionar')))
  with check ((select public.has_permission('encuestas.gestionar')));

-- Una encuesta activa no se elimina (primero se desactiva); con respuestas tampoco (lo impide la
-- llave foránea de survey_responses).
drop policy if exists surveys_delete on public.surveys;
create policy surveys_delete on public.surveys
  for delete to authenticated using ((select public.has_permission('encuestas.gestionar')) and not is_active);

drop policy if exists survey_questions_insert on public.survey_questions;
create policy survey_questions_insert on public.survey_questions
  for insert to authenticated with check ((select public.has_permission('encuestas.gestionar')));

drop policy if exists survey_questions_update on public.survey_questions;
create policy survey_questions_update on public.survey_questions
  for update to authenticated
  using ((select public.has_permission('encuestas.gestionar')))
  with check ((select public.has_permission('encuestas.gestionar')));

drop policy if exists survey_questions_delete on public.survey_questions;
create policy survey_questions_delete on public.survey_questions
  for delete to authenticated using ((select public.has_permission('encuestas.gestionar')));

-- ---------------------------------------------------------------------------------------------
-- Reglas de edición: con respuestas, solo se corrigen textos. Aplica a todos (también al SQL
-- Editor) para que los resultados no cambien de sentido. Borrar la encuesta entera (cascada) sí
-- pasa, pero una encuesta con respuestas no se puede borrar por la llave de survey_responses.
-- ---------------------------------------------------------------------------------------------
create or replace function public.survey_has_responses(p_survey_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.survey_responses where survey_id = p_survey_id);
$$;

create or replace function public.survey_questions_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if public.survey_has_responses(new.survey_id) then
      raise exception 'survey_locked' using hint = 'La encuesta ya tiene respuestas: no se pueden agregar preguntas.';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if public.survey_has_responses(old.survey_id) then
      raise exception 'survey_locked' using hint = 'La encuesta ya tiene respuestas: no se pueden quitar preguntas.';
    end if;
    return old;
  end if;

  if (new.survey_id, new.code, new.position, new.type, new.scale_min, new.scale_max, new.is_required)
     is distinct from
     (old.survey_id, old.code, old.position, old.type, old.scale_min, old.scale_max, old.is_required)
     and public.survey_has_responses(old.survey_id) then
    raise exception 'survey_locked' using hint = 'La encuesta ya tiene respuestas: solo se pueden corregir textos.';
  end if;
  return new;
end;
$$;

drop trigger if exists survey_questions_guard on public.survey_questions;
create trigger survey_questions_guard
  before insert or update or delete on public.survey_questions
  for each row execute function public.survey_questions_guard();

-- ---------------------------------------------------------------------------------------------
-- save_survey: crea o edita una encuesta con todas sus preguntas en una transacción.
-- security invoker: se aplican los privilegios, las políticas (encuestas.gestionar) y el trigger.
--
-- p_questions: [{ id?, code, text, help_text?, type, scale_min?, scale_max?, min_label?,
--   max_label?, is_required }] en el orden en que se muestran.
-- Sin respuestas: las preguntas se reemplazan por completo (se conservan los id enviados).
-- Con respuestas: deben llegar las mismas preguntas, en el mismo orden, y solo cambian los textos.
-- ---------------------------------------------------------------------------------------------
create or replace function public.save_survey(p_id uuid, p_code text, p_title text, p_questions jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer;
  v_locked boolean;
begin
  if not public.has_permission('encuestas.gestionar') then
    raise exception 'forbidden' using errcode = '42501', hint = 'Requiere el permiso encuestas.gestionar.';
  end if;
  if p_title is null or char_length(trim(p_title)) not between 3 and 120 then
    raise exception 'invalid_title' using hint = 'El título debe tener entre 3 y 120 caracteres.';
  end if;
  if p_questions is null or jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) = 0 then
    raise exception 'no_questions' using hint = 'La encuesta debe tener al menos una pregunta.';
  end if;
  v_count := jsonb_array_length(p_questions);
  if v_count > 30 then
    raise exception 'too_many_questions' using hint = 'La encuesta puede tener hasta 30 preguntas.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_questions) q
    where char_length(trim(coalesce(q ->> 'text', ''))) not between 5 and 200
       or char_length(coalesce(q ->> 'help_text', '')) > 300
       or char_length(coalesce(q ->> 'min_label', '')) > 40
       or char_length(coalesce(q ->> 'max_label', '')) > 40
  ) then
    raise exception 'invalid_question' using hint = 'Revise los textos de las preguntas.';
  end if;

  if p_id is null then
    insert into public.surveys (code, title) values (p_code, trim(p_title)) returning id into v_id;
    v_locked := false;
  else
    update public.surveys set title = trim(p_title) where id = p_id returning id into v_id;
    if v_id is null then
      raise exception 'survey_not_found' using hint = 'La encuesta no existe o no tiene permiso para editarla.';
    end if;
    v_locked := public.survey_has_responses(v_id);
  end if;

  if v_locked then
    -- Mismas preguntas en el mismo orden: solo se actualizan los textos.
    if v_count <> (select count(*) from public.survey_questions where survey_id = v_id)
       or exists (
         select 1
         from jsonb_array_elements(p_questions) with ordinality as e(q, n)
         left join public.survey_questions sq
           on sq.id::text = e.q ->> 'id' and sq.survey_id = v_id
         where sq.id is null or sq.position <> e.n
       ) then
      raise exception 'survey_locked' using hint = 'La encuesta ya tiene respuestas: solo se pueden corregir textos.';
    end if;

    update public.survey_questions sq
       set text = trim(e.q ->> 'text'),
           help_text = nullif(trim(coalesce(e.q ->> 'help_text', '')), ''),
           min_label = case when sq.type = 'scale' then trim(e.q ->> 'min_label') end,
           max_label = case when sq.type = 'scale' then trim(e.q ->> 'max_label') end
      from jsonb_array_elements(p_questions) as e(q)
     where sq.id::text = e.q ->> 'id' and sq.survey_id = v_id;
  else
    delete from public.survey_questions where survey_id = v_id;

    insert into public.survey_questions
      (id, survey_id, code, position, text, help_text, type, scale_min, scale_max, min_label, max_label, is_required)
    select
      coalesce(nullif(e.q ->> 'id', '')::uuid, gen_random_uuid()),
      v_id,
      e.q ->> 'code',
      e.n,
      trim(e.q ->> 'text'),
      nullif(trim(coalesce(e.q ->> 'help_text', '')), ''),
      e.q ->> 'type',
      case when e.q ->> 'type' = 'scale' then (e.q ->> 'scale_min')::smallint end,
      case when e.q ->> 'type' = 'scale' then (e.q ->> 'scale_max')::smallint end,
      case when e.q ->> 'type' = 'scale' then trim(e.q ->> 'min_label') end,
      case when e.q ->> 'type' = 'scale' then trim(e.q ->> 'max_label') end,
      coalesce((e.q ->> 'is_required')::boolean, true)
    from jsonb_array_elements(p_questions) with ordinality as e(q, n);
  end if;

  return v_id;
end;
$$;

-- Activa una encuesta (y desactiva la que estaba activa) o la desactiva, en una transacción.
create or replace function public.set_active_survey(p_id uuid, p_active boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.has_permission('encuestas.gestionar') then
    raise exception 'forbidden' using errcode = '42501', hint = 'Requiere el permiso encuestas.gestionar.';
  end if;
  if not exists (select 1 from public.surveys where id = p_id) then
    raise exception 'survey_not_found' using hint = 'La encuesta no existe.';
  end if;

  if p_active then
    if not exists (select 1 from public.survey_questions where survey_id = p_id) then
      raise exception 'no_questions' using hint = 'La encuesta debe tener al menos una pregunta.';
    end if;
    update public.surveys set is_active = false where is_active and id <> p_id;
    update public.surveys set is_active = true where id = p_id;
  else
    update public.surveys set is_active = false where id = p_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Resultados: solo conteos, nunca respuestas sueltas.
-- ---------------------------------------------------------------------------------------------
create or replace function public.list_surveys()
returns table (
  id uuid,
  code text,
  title text,
  is_active boolean,
  created_at timestamptz,
  question_count bigint,
  response_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_permission('encuestas.ver') then
    raise exception 'forbidden' using errcode = '42501', hint = 'Requiere el permiso encuestas.ver.';
  end if;

  return query
    select
      s.id,
      s.code,
      s.title,
      s.is_active,
      s.created_at,
      (select count(*) from public.survey_questions q where q.survey_id = s.id),
      (select count(*) from public.survey_responses r where r.survey_id = s.id)
    from public.surveys s
    order by s.is_active desc, s.created_at desc;
end;
$$;

-- Conteos de un periodo (fechas en hora de Colombia, ambas inclusive):
-- { total, answers: [{ question_id, value, count }] }.
create or replace function public.survey_stats(p_survey_id uuid, p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_from timestamptz;
  v_to timestamptz;
begin
  if not public.has_permission('encuestas.ver') then
    raise exception 'forbidden' using errcode = '42501', hint = 'Requiere el permiso encuestas.ver.';
  end if;
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'invalid_period' using hint = 'El periodo no es válido.';
  end if;

  v_from := p_from::timestamp at time zone 'America/Bogota';
  v_to := (p_to + 1)::timestamp at time zone 'America/Bogota';

  return jsonb_build_object(
    'total', (
      select count(*) from public.survey_responses r
      where r.survey_id = p_survey_id and r.created_at >= v_from and r.created_at < v_to
    ),
    'answers', coalesce((
      select jsonb_agg(jsonb_build_object('question_id', c.question_id, 'value', c.value, 'count', c.n))
      from (
        select a.question_id, a.value, count(*) as n
        from public.survey_answers a
        join public.survey_responses r on r.id = a.response_id
        where r.survey_id = p_survey_id and r.created_at >= v_from and r.created_at < v_to
        group by a.question_id, a.value
      ) c
    ), '[]'::jsonb)
  );
end;
$$;

-- Tarjeta de Inicio: respuestas del año en curso de la encuesta activa (sin filas si no hay).
create or replace function public.survey_summary()
returns table (survey_id uuid, title text, year integer, responses bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_year integer := extract(year from now() at time zone 'America/Bogota')::integer;
begin
  if not public.has_permission('encuestas.ver') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select
      s.id,
      s.title,
      v_year,
      (
        select count(*) from public.survey_responses r
        where r.survey_id = s.id
          and r.created_at >= make_date(v_year, 1, 1)::timestamp at time zone 'America/Bogota'
          and r.created_at < make_date(v_year + 1, 1, 1)::timestamp at time zone 'America/Bogota'
      )
    from public.surveys s
    where s.is_active;
end;
$$;

revoke execute on function public.survey_has_responses(uuid) from public, anon;
revoke execute on function public.save_survey(uuid, text, text, jsonb) from public, anon;
revoke execute on function public.set_active_survey(uuid, boolean) from public, anon;
revoke execute on function public.list_surveys() from public, anon;
revoke execute on function public.survey_stats(uuid, date, date) from public, anon;
revoke execute on function public.survey_summary() from public, anon;
grant execute on function public.survey_has_responses(uuid) to authenticated;
grant execute on function public.save_survey(uuid, text, text, jsonb) to authenticated;
grant execute on function public.set_active_survey(uuid, boolean) to authenticated;
grant execute on function public.list_surveys() to authenticated;
grant execute on function public.survey_stats(uuid, date, date) to authenticated;
grant execute on function public.survey_summary() to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Permisos y asignación inicial (juzgado no recibe ninguno).
-- ---------------------------------------------------------------------------------------------
insert into public.permissions (code, module, name, description) values
  ('encuestas.ver', 'encuestas', 'Ver encuestas', 'Ver las encuestas, sus preguntas y los resultados (solo totales).'),
  ('encuestas.gestionar', 'encuestas', 'Gestionar encuestas', 'Crear, editar, duplicar, activar, desactivar y eliminar encuestas.')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_code)
select r.id, 'encuestas.ver'
from public.roles r
where r.code in ('oficina', 'director_oficina')
on conflict do nothing;
