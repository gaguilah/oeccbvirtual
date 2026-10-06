-- Perfiles de los usuarios del dashboard (base del dashboard, docs/plan-dashboard.md).
--
-- La tabla ya existía en Supabase, creada a mano (sin migración) con:
--   create table public.profiles (
--     id uuid primary key references auth.users(id) on delete cascade,
--     full_name text,
--     created_at timestamptz default now()
--   );
--   + RLS y tres políticas: "Los usuarios pueden ver / actualizar / crear su propio perfil".
--
-- Esta migración es idempotente (sirve sobre esa tabla y sobre una base vacía) y deja el repo como
-- fuente de verdad. Cambios respecto a lo creado a mano:
--   - created_at pasa a not null y se agrega updated_at (lo mantiene un trigger).
--   - Se quitan las políticas de insert y update: el perfil no se edita desde el navegador. Cuando
--     exista un rol por usuario, una política "actualizar su propio perfil" dejaría que cualquiera
--     se cambiara el rol a sí mismo. Las altas y cambios los hará el plan de Usuarios, roles y
--     permisos (Edge Function con la service role key, que ignora RLS).
--   - La de select se reemplaza por una equivalente, limitada al rol authenticated.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabla creada a mano: created_at admitía null y no había updated_at.
update public.profiles set created_at = now() where created_at is null;
alter table public.profiles alter column created_at set default now();
alter table public.profiles alter column created_at set not null;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create or replace function public.profiles_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.profiles_set_updated_at();

alter table public.profiles enable row level security;

-- Políticas creadas a mano.
drop policy if exists "Los usuarios pueden ver su propio perfil" on public.profiles;
drop policy if exists "Los usuarios pueden actualizar su propio perfil" on public.profiles;
drop policy if exists "Los usuarios pueden crear su propio perfil" on public.profiles;

-- Cada usuario autenticado lee solo su propia fila.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

-- Además de RLS, sin privilegios de escritura desde el cliente (defensa en profundidad).
revoke all on table public.profiles from anon;
revoke insert, update, delete on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
