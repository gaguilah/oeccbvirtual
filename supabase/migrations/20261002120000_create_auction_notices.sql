-- =========================================================
-- Avisos de remate (ver docs/plan-remates.md)
-- =========================================================
-- URL del PDF de cada aviso:
--   https://publicacionesprocesales.ramajudicial.gov.co/documents/<group_id>/<folder_id>/
--     <radicado>-<AAAAMMDD><HH>-J0<juzgado>ECC.pdf
-- HH es la hora en formato de 12 horas (2:30 p. m. → 02), verificado contra el sitio.

-- =========================================================
-- Carpetas de publicación (las dos secciones de números de la URL)
-- =========================================================
-- Cuando la Rama Judicial cambie la carpeta, se agrega una fila nueva con su
-- valid_from; las anteriores no se editan. Cada aviso usa la carpeta vigente en
-- la fecha de su created_at (fecha de publicación).
create table public.pdf_folders (
  id          uuid primary key default gen_random_uuid(),
  group_id    bigint not null check (group_id > 0),
  folder_id   bigint not null check (folder_id > 0),
  valid_from  date not null unique,
  created_at  timestamptz not null default now()
);

-- =========================================================
-- Avisos de remate
-- =========================================================
create table public.auction_notices (
  id            uuid primary key default gen_random_uuid(),
  case_number   text not null
                constraint auction_notices_case_number_chk check (case_number ~ '^[0-9]{23}$'),
  court         smallint not null
                constraint auction_notices_court_chk check (court in (1, 2)),
  scheduled_at  timestamptz not null,
  -- La genera el trigger. Se valida con un check (y no con NOT NULL) para que el
  -- Table Editor de Supabase permita dejarla vacía al crear un aviso.
  pdf_url       text
                constraint auction_notices_pdf_url_chk check (pdf_url is not null and pdf_url ~ '^https://'),
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz,

  -- Un radicado puede tener varios remates, pero no dos a la misma fecha y hora.
  constraint auction_notices_case_scheduled_key unique (case_number, scheduled_at)
);

create index auction_notices_scheduled_at_idx
  on public.auction_notices (scheduled_at);

create index auction_notices_court_scheduled_at_idx
  on public.auction_notices (court, scheduled_at);

-- =========================================================
-- Trigger: pdf_url, created_at y updated_at
-- =========================================================
-- INSERT: si pdf_url viene vacía, la genera con la carpeta vigente en created_at.
-- UPDATE: created_at no cambia y updated_at se actualiza. La URL se regenera (con la
--   carpeta del created_at original) solo si cambian radicado, juzgado o fecha, o si
--   se vacía pdf_url; si no, se respeta una pdf_url corregida a mano.
--
-- SECURITY INVOKER con search_path vacío, como submit_survey_response: lee
-- pdf_folders con los permisos de quien escribe. Hoy solo escriben el panel y el
-- SQL Editor (rol postgres). La parte privada deberá dar a los administradores
-- lectura sobre pdf_folders; sin ella, el insert falla con "no_pdf_folder".
create or replace function public.auction_notices_before_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_published_on date;
  v_folder       public.pdf_folders%rowtype;
begin
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
    new.updated_at := now();

    if new.pdf_url is not null
       and new.case_number  is not distinct from old.case_number
       and new.court        is not distinct from old.court
       and new.scheduled_at is not distinct from old.scheduled_at then
      return new;
    end if;
  elsif new.pdf_url is not null then
    return new;
  end if;

  v_published_on := (new.created_at at time zone 'America/Bogota')::date;

  select * into v_folder
  from public.pdf_folders
  where valid_from <= v_published_on
  order by valid_from desc
  limit 1;

  if not found then
    raise exception 'no_pdf_folder'
      using detail = format('No hay carpeta de publicación vigente para el %s.', v_published_on),
            hint   = 'Agregue una fila en pdf_folders con valid_from menor o igual a esa fecha.';
  end if;

  new.pdf_url := format(
    'https://publicacionesprocesales.ramajudicial.gov.co/documents/%s/%s/%s-%s-J0%sECC.pdf',
    v_folder.group_id,
    v_folder.folder_id,
    new.case_number,
    to_char(new.scheduled_at at time zone 'America/Bogota', 'YYYYMMDDHH12'),
    new.court
  );

  return new;
end;
$$;

revoke all on function public.auction_notices_before_write() from public, anon, authenticated;

create trigger auction_notices_before_write
  before insert or update on public.auction_notices
  for each row execute function public.auction_notices_before_write();

-- =========================================================
-- Seguridad: RLS
-- =========================================================
alter table public.pdf_folders     enable row level security;
alter table public.auction_notices enable row level security;

-- Lectura pública solo de avisos publicados.
create policy "Avisos de remate publicados visibles públicamente"
  on public.auction_notices for select
  to anon, authenticated
  using (is_published = true);

-- pdf_folders no tiene políticas y auction_notices no tiene políticas de escritura:
-- con RLS activo, anon y authenticated no pueden escribir en ninguna de las dos
-- ni leer pdf_folders. Las políticas de administración llegarán con la parte privada.
