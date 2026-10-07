-- Aceptación de los términos y condiciones de tratamiento de datos (docs/terminos-tratamiento-datos.md).
--
-- terms_accepted_at: fecha y hora en que el ciudadano aceptó los términos al enviar la PQRS. Es la
-- prueba de la autorización (Ley 1581 de 2012). La llena la Edge Function submit-request, que
-- rechaza la solicitud si no llega la aceptación. Las PQRS anteriores a este cambio quedan en null.
alter table public.customer_requests add column if not exists terms_accepted_at timestamptz;
