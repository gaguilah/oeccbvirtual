-- Regla del nombre en la base de datos. El formulario de Mi perfil ya la valida
-- (src/dashboard/profile/schema.ts), pero cualquier usuario con sesión puede llamar a la API de
-- Supabase directamente; esta restricción es la que la hace cumplir. Si cambia, cambiar las dos.
--
-- full_name: null (perfil sin nombre) o de 3 a 120 caracteres, palabras de letras (con tildes,
-- ñ, ü…) separadas por un espacio, un guion, un apóstrofo o ". " (abreviatura), con punto final
-- opcional. Sin números, símbolos ni espacios al principio o al final.
--
-- "not valid": se aplica a todo insert y update desde ahora, pero no revisa las filas que ya
-- existen (alguna pudo guardarse con números durante las pruebas). Después de corregirlas:
--   alter table public.profiles validate constraint profiles_full_name_format;

alter table public.profiles drop constraint if exists profiles_full_name_format;
alter table public.profiles
  add constraint profiles_full_name_format
  check (
    full_name is null
    or (
      char_length(full_name) between 3 and 120
      and full_name ~ '^[A-Za-zÀ-ÖØ-öø-ÿ]+((\. |[ ''-])[A-Za-zÀ-ÖØ-öø-ÿ]+)*\.?$'
    )
  )
  not valid;
