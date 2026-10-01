-- Restringe `type` a los tipos de PQRS que acepta la Edge Function
-- `submit-request` (ALLOWED_TYPES) y el formulario (components/pqrs/data.ts).
-- Si se agrega un tipo, actualizar los tres lugares.
alter table public.customer_requests
  drop constraint if exists customer_requests_type_chk;

alter table public.customer_requests
  add constraint customer_requests_type_chk
  check (type in ('peticion', 'queja', 'reclamo', 'sugerencia', 'felicitacion'));
