-- =========================================================
-- Encuestas
-- =========================================================
create table public.surveys (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  title       text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- =========================================================
-- Preguntas de cada encuesta
-- =========================================================
create table public.survey_questions (
  id           uuid primary key default gen_random_uuid(),
  survey_id    uuid not null references public.surveys(id) on delete cascade,
  code         text not null,
  position     smallint not null check (position > 0),
  text         text not null,
  help_text    text,
  type         text not null check (type in ('yes_no', 'scale')),
  scale_min    smallint,
  scale_max    smallint,
  min_label    text,
  max_label    text,
  is_required  boolean not null default true,
  created_at   timestamptz not null default now(),

  unique (survey_id, code),
  unique (survey_id, position),

  -- Una pregunta de escala debe tener rango y etiquetas coherentes;
  -- una SI/NO no debe tener datos de escala.
  constraint survey_questions_scale_chk check (
    (type = 'scale'
      and scale_min is not null and scale_max is not null
      and scale_min >= 0 and scale_max <= 10
      and scale_min < scale_max
      and min_label is not null and max_label is not null)
    or
    (type = 'yes_no'
      and scale_min is null and scale_max is null
      and min_label is null and max_label is null)
  )
);

-- =========================================================
-- Envíos (una fila por encuesta diligenciada)
-- =========================================================
create table public.survey_responses (
  id          uuid primary key default gen_random_uuid(),
  survey_id   uuid not null references public.surveys(id),
  created_at  timestamptz not null default now()
);

create index survey_responses_survey_id_idx
  on public.survey_responses (survey_id);

-- =========================================================
-- Respuestas (una fila por pregunta dentro de un envío)
-- =========================================================
create table public.survey_answers (
  response_id  uuid not null references public.survey_responses(id) on delete cascade,
  question_id  uuid not null references public.survey_questions(id),
  value        smallint not null check (value between 0 and 10),
  primary key (response_id, question_id)
);

create index survey_answers_question_id_idx
  on public.survey_answers (question_id);

-- =========================================================
-- Seguridad: RLS
-- =========================================================
alter table public.surveys          enable row level security;
alter table public.survey_questions enable row level security;
alter table public.survey_responses enable row level security;
alter table public.survey_answers   enable row level security;

-- Lectura pública solo de encuestas activas y sus preguntas
create policy "Encuestas activas visibles públicamente"
  on public.surveys for select
  to anon, authenticated
  using (is_active = true);

create policy "Preguntas de encuestas activas visibles públicamente"
  on public.survey_questions for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.surveys s
      where s.id = survey_questions.survey_id
        and s.is_active = true
    )
  );

-- survey_responses y survey_answers NO tienen políticas:
-- con RLS activo, anon y authenticated no pueden leer ni escribir.
-- Los envíos entrarán solo por la Edge Function (con Turnstile).