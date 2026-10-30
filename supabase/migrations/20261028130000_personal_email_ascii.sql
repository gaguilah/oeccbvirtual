-- Mi perfil: el correo personal solo admite ASCII imprimible (docs/plan-correcciones-revision.md, punto 5).
--
-- profile_personal_info_email_chk exige personal_email = lower(personal_email), y el formulario pasa
-- el correo a minúsculas con toLowerCase() de JavaScript. Con letras fuera de ASCII (İ, tildes) las
-- dos pueden dar resultados distintos y el guardado fallaba con un error genérico. Con solo ASCII
-- coinciden siempre. La misma regla está en src/dashboard/profile/personalSchema.ts (EMAIL_CHARS):
-- cambiar los dos juntos. Idempotente.

alter table public.profile_personal_info
  drop constraint if exists profile_personal_info_email_ascii_chk;

alter table public.profile_personal_info
  add constraint profile_personal_info_email_ascii_chk check (personal_email ~ '^[\x21-\x7e]+$');
