-- =========================================================
-- Solicitudes PQRS
-- =========================================================
-- La tabla ya existe en producción (se creó desde el panel); esta migración
-- la deja documentada en el repo y la crea en instalaciones nuevas.
-- `if not exists` evita que falle donde ya está creada.
--
-- Solo escribe en ella la Edge Function `submit-request`, con la service_role.
-- status: 0 = recibida (valor inicial). response: respuesta de la oficina.
create table if not exists public.customer_requests (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,
  name        text not null,
  email       text not null,
  summary     text not null,
  status      smallint not null default 0,
  response    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

-- RLS activo y sin políticas: ni anon ni authenticated pueden leer ni escribir.
alter table public.customer_requests enable row level security;
