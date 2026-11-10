-- Preguntas frecuentes del sitio público (docs/plan-preguntas-frecuentes.md, fase 1).
--
-- Secciones (Títulos, Oficios, …) y preguntas, administradas desde el dashboard con
-- preguntas.gestionar. El público solo lee las preguntas publicadas y solo las columnas que muestra
-- la página. Las preguntas nacen ocultas. El orden (position) lo pone el trigger al crear y lo
-- cambian move_faq_question / move_faq_section. El contenido inicial no va aquí: está en
-- supabase/data/faq_initial.sql, para correr una vez en el SQL Editor.

-- ---------------------------------------------------------------------------------------------
-- Secciones.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.faq_sections (
  id bigint generated always as identity primary key,
  -- Ancla pública (#consignaciones). Se genera del título al crear y no cambia (sin grant de UPDATE).
  slug text not null unique
    constraint faq_sections_slug_chk check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null
    constraint faq_sections_title_chk check (char_length(title) between 3 and 80 and title = btrim(title)),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.faq_sections enable row level security;
revoke all on table public.faq_sections from anon, authenticated;
grant select on table public.faq_sections to anon, authenticated;
grant insert (slug, title) on table public.faq_sections to authenticated;
grant update (title, position) on table public.faq_sections to authenticated;
grant delete on table public.faq_sections to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Preguntas.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.faq_questions (
  id bigint generated always as identity primary key,
  -- Una sección con preguntas no se puede eliminar.
  section_id bigint not null references public.faq_sections (id) on delete restrict,
  question text not null
    constraint faq_questions_question_chk check (char_length(question) between 10 and 200 and question = btrim(question)),
  -- Texto con **negrita**, líneas "- " (lista) y líneas en blanco (párrafos); nada de HTML.
  answer text not null
    constraint faq_questions_answer_chk check (char_length(answer) between 10 and 4000 and answer = btrim(answer)),
  position integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists faq_questions_section_idx on public.faq_questions (section_id, position);

alter table public.faq_questions enable row level security;
revoke all on table public.faq_questions from anon, authenticated;
-- El público: solo lo que muestra la página. Nunca created_by / updated_by.
grant select (id, section_id, question, answer, position) on table public.faq_questions to anon;
grant select (id, section_id, question, answer, position, is_published, created_at, updated_at)
  on table public.faq_questions to authenticated;
grant insert (section_id, question, answer, is_published) on table public.faq_questions to authenticated;
grant update (section_id, question, answer, is_published, position) on table public.faq_questions to authenticated;
grant delete on table public.faq_questions to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Triggers: orden al crear, fechas y autor.
-- ---------------------------------------------------------------------------------------------
create or replace function public.faq_sections_before_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.position := coalesce((select max(s.position) from public.faq_sections s), 0) + 1;
    new.created_at := now();
    new.updated_at := now();
    return new;
  end if;

  new.slug := old.slug;
  new.created_at := old.created_at;
  if new.title is distinct from old.title then
    new.updated_at := now();
  else
    new.updated_at := old.updated_at;
  end if;
  return new;
end;
$$;

drop trigger if exists faq_sections_before_write on public.faq_sections;
create trigger faq_sections_before_write
  before insert or update on public.faq_sections
  for each row execute function public.faq_sections_before_write();

create or replace function public.faq_questions_before_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.position := coalesce(
      (select max(q.position) from public.faq_questions q where q.section_id = new.section_id), 0
    ) + 1;
    new.created_at := now();
    new.updated_at := now();
    new.created_by := (select auth.uid());
    new.updated_by := new.created_by;
    return new;
  end if;

  new.created_at := old.created_at;
  new.created_by := old.created_by;
  -- Al cambiar de sección, queda al final de la nueva.
  if new.section_id is distinct from old.section_id then
    new.position := coalesce(
      (select max(q.position) from public.faq_questions q where q.section_id = new.section_id), 0
    ) + 1;
  end if;
  -- Reordenar no cuenta como modificación.
  if (new.section_id, new.question, new.answer, new.is_published)
     is distinct from (old.section_id, old.question, old.answer, old.is_published) then
    new.updated_at := now();
    new.updated_by := (select auth.uid());
  else
    new.updated_at := old.updated_at;
    new.updated_by := old.updated_by;
  end if;
  return new;
end;
$$;

drop trigger if exists faq_questions_before_write on public.faq_questions;
create trigger faq_questions_before_write
  before insert or update on public.faq_questions
  for each row execute function public.faq_questions_before_write();

revoke execute on function public.faq_sections_before_write() from public, anon, authenticated;
revoke execute on function public.faq_questions_before_write() from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- RLS.
-- ---------------------------------------------------------------------------------------------
drop policy if exists faq_sections_select on public.faq_sections;
create policy faq_sections_select on public.faq_sections
  for select to anon, authenticated using (true);

drop policy if exists faq_sections_insert on public.faq_sections;
create policy faq_sections_insert on public.faq_sections
  for insert to authenticated with check ((select public.has_permission('preguntas.gestionar')));

drop policy if exists faq_sections_update on public.faq_sections;
create policy faq_sections_update on public.faq_sections
  for update to authenticated
  using ((select public.has_permission('preguntas.gestionar')))
  with check ((select public.has_permission('preguntas.gestionar')));

drop policy if exists faq_sections_delete on public.faq_sections;
create policy faq_sections_delete on public.faq_sections
  for delete to authenticated using ((select public.has_permission('preguntas.gestionar')));

drop policy if exists faq_questions_select_public on public.faq_questions;
create policy faq_questions_select_public on public.faq_questions
  for select to anon, authenticated using (is_published);

drop policy if exists faq_questions_select_dashboard on public.faq_questions;
create policy faq_questions_select_dashboard on public.faq_questions
  for select to authenticated using ((select public.has_permission('preguntas.ver')));

drop policy if exists faq_questions_insert on public.faq_questions;
create policy faq_questions_insert on public.faq_questions
  for insert to authenticated with check ((select public.has_permission('preguntas.gestionar')));

drop policy if exists faq_questions_update on public.faq_questions;
create policy faq_questions_update on public.faq_questions
  for update to authenticated
  using ((select public.has_permission('preguntas.gestionar')))
  with check ((select public.has_permission('preguntas.gestionar')));

drop policy if exists faq_questions_delete on public.faq_questions;
create policy faq_questions_delete on public.faq_questions
  for delete to authenticated using ((select public.has_permission('preguntas.gestionar')));

-- ---------------------------------------------------------------------------------------------
-- Reordenar: intercambia la posición con la vecina (arriba o abajo), en una sola transacción.
-- Antes renumera 1..n, por si hay posiciones repetidas. security invoker: aplican grants y RLS.
-- ---------------------------------------------------------------------------------------------
create or replace function public.move_faq_question(p_id bigint, p_up boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_section bigint;
  v_position integer;
  v_other bigint;
  v_other_position integer;
begin
  if not public.has_permission('preguntas.gestionar') then
    raise exception 'preguntas_gestionar_required' using errcode = '42501';
  end if;

  select q.section_id into v_section from public.faq_questions q where q.id = p_id;
  if not found then
    raise exception 'faq_not_found' using errcode = 'P0002';
  end if;

  update public.faq_questions q
  set position = r.n
  from (
    select x.id, row_number() over (order by x.position, x.id)::integer as n
    from public.faq_questions x
    where x.section_id = v_section
  ) r
  where q.id = r.id and q.position is distinct from r.n;

  select q.position into v_position from public.faq_questions q where q.id = p_id;

  select q.id, q.position into v_other, v_other_position
  from public.faq_questions q
  where q.section_id = v_section
    and (case when p_up then q.position < v_position else q.position > v_position end)
  order by case when p_up then -q.position else q.position end
  limit 1;

  if v_other is null then
    return;
  end if;

  update public.faq_questions set position = v_other_position where id = p_id;
  update public.faq_questions set position = v_position where id = v_other;
end;
$$;

create or replace function public.move_faq_section(p_id bigint, p_up boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_position integer;
  v_other bigint;
  v_other_position integer;
begin
  if not public.has_permission('preguntas.gestionar') then
    raise exception 'preguntas_gestionar_required' using errcode = '42501';
  end if;

  if not exists (select 1 from public.faq_sections s where s.id = p_id) then
    raise exception 'faq_not_found' using errcode = 'P0002';
  end if;

  update public.faq_sections s
  set position = r.n
  from (
    select x.id, row_number() over (order by x.position, x.id)::integer as n from public.faq_sections x
  ) r
  where s.id = r.id and s.position is distinct from r.n;

  select s.position into v_position from public.faq_sections s where s.id = p_id;

  select s.id, s.position into v_other, v_other_position
  from public.faq_sections s
  where (case when p_up then s.position < v_position else s.position > v_position end)
  order by case when p_up then -s.position else s.position end
  limit 1;

  if v_other is null then
    return;
  end if;

  update public.faq_sections set position = v_other_position where id = p_id;
  update public.faq_sections set position = v_position where id = v_other;
end;
$$;

revoke execute on function public.move_faq_question(bigint, boolean) from public, anon;
revoke execute on function public.move_faq_section(bigint, boolean) from public, anon;
grant execute on function public.move_faq_question(bigint, boolean) to authenticated;
grant execute on function public.move_faq_section(bigint, boolean) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Permisos. Los administra el director de oficina (se puede cambiar en Roles); el Administrador
-- de Sistema los tiene siempre. Si el rol no existe (base vacía), no se asigna.
-- ---------------------------------------------------------------------------------------------
insert into public.permissions (code, module, name, description) values
  ('preguntas.ver', 'preguntas', 'Ver preguntas frecuentes',
   'Ver la opción "Preguntas frecuentes" del menú, con las preguntas publicadas y las ocultas.'),
  ('preguntas.gestionar', 'preguntas', 'Gestionar preguntas frecuentes',
   'Crear, editar, ordenar, publicar u ocultar y eliminar preguntas y secciones del sitio público.')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_code)
select r.id, p.code
from public.roles r
cross join (values ('preguntas.ver'), ('preguntas.gestionar')) as p (code)
where r.code = 'director_oficina'
on conflict do nothing;
