# Plan: seguridad de Supabase (propuesto el 2026-11-03)

Sale de la revisión de seguridad del 2026-11-03: avisos de seguridad de Supabase, RLS, grants y políticas
de cada tabla, funciones `security definer`, Edge Functions, claves de API y Data API. No se encontró nada
que se pueda explotar hoy. Este plan cierra lo que queda débil y prepara el retiro de las claves antiguas
de Supabase (inicios de 2027). Rama propuesta: `seguridad-supabase`, fusionada con PR (CLAUDE.md,
"New deployment or security configuration").

## Ya hecho durante la revisión (2026-11-03)

- **Registro público apagado** en Auth: las cuentas solo se crean con `manage-users`.
- **"Automatically expose new tables" apagado** (Settings → Data API). Comprobado en `pg_default_acl`: las
  tablas nuevas de `postgres` ya no dan SELECT, INSERT, UPDATE ni DELETE a `anon`, `authenticated` ni
  `service_role`, y las funciones nuevas no dan EXECUTE a nadie. Todavía se dan por defecto TRUNCATE,
  REFERENCES, TRIGGER y MAINTAIN, así que cada migración sigue necesitando su `revoke all` + grants
  explícitos (incluidos `service_role` y `grant execute`).
- **Esquemas publicados:** solo `public` y `graphql_public`. pg_net vive en `net`, que no está publicado.
- **Claves:** la app usa `sb_publishable_…`. Existe una clave secreta `default` sin usar todavía.

## Decisiones tomadas (2026-11-03)

| Tema | Decisión |
|---|---|
| Contraseñas | Mínimo 8 (máximo 72), con **al menos una letra y un número**, igual en Auth y en la app |
| Captcha del login | Se despliega primero el código; se activa en Auth y se prueba **en producción**; si falla, se desactiva en un clic |
| `verify_jwt` de `manage-users` y `respond-request` | Se **mantiene activado** (sigue funcionando con los tokens actuales); se revisa solo si un día se migra a las claves de firma de JWT |
| Extra de la migración | Una prueba de Vitest que vigile las migraciones nuevas |
| Fuera de este plan | Protección de contraseñas filtradas, MFA, tiempo límite de sesión, claves de firma de JWT, cerrar `net.http_post`, quitar los permisos por defecto que quedan |

## Fase 1 · Migración de limpieza de permisos (hecha el 2026-11-03)

**Resultado:** aplicada y registrada en el historial. Solo `list_public_hearings` se puede ejecutar sin
sesión, `survey_responses` y `survey_answers` no tienen permisos para `anon` ni `authenticated`, y
`handle_new_user` tiene `search_path` vacío. El aviso de seguridad sobre `handle_new_user` desapareció.
Un `update` como usuario con sesión (en una transacción que se deshizo) pasó con sus triggers. Además se
quitaron los permisos de `anon` y `authenticated` sobre las secuencias: son de columnas identity y no los
necesitan. Probado en producción el 2026-11-03: sitio público sin sesión (Avisos de Remate y Audiencias listan y
abren el detalle, se enviaron una PQRS y una encuesta) y dashboard (Avisos de Remate y Audiencias listan y
abren, llegaron la PQRS y la respuesta de la encuesta, se editó el nombre en Mi perfil). También pasaron Usuarios (lista), Encuestas (resultados), una edición
en Avisos de Remate o Audiencias y guardar un rol sin cambios.

Migración nueva `20261103120000_security_cleanup.sql`, idempotente, aplicada por SQL Editor o
`apply_migration` (el CLI no conecta) y registrada en el historial.

1. **Encuesta:** `revoke all` sobre `survey_responses` y `survey_answers` para `anon` y `authenticated`.
   Hoy tienen INSERT, UPDATE, DELETE y TRUNCATE (solo los frena la RLS sin políticas). Solo las escribe
   `submit_survey_response` con `service_role`, que no se toca.
2. **Todas las tablas de `public`:** quitar TRUNCATE, REFERENCES, TRIGGER y MAINTAIN a `anon` y
   `authenticated`. Quedan en `auction_notices`, `surveys`, `survey_questions` y `profiles` (permisos
   automáticos de antes de 2026-10). Ninguna pantalla los usa. Los SELECT, INSERT, UPDATE y DELETE por
   columna que sí usa el navegador **no se tocan**.
3. **Funciones de trigger:** quitar EXECUTE a `public`, `anon` y `authenticated` en `handle_new_user`,
   `set_updated_at`, `profiles_set_updated_at`, `profiles_check_court`, `roles_protect`,
   `role_permissions_protect`, `survey_questions_guard` y `profile_personal_info_section_dates`. Los
   triggers siguen funcionando (no necesitan ese permiso). Además, `handle_new_user` pasa de
   `search_path=public` a `search_path=''`; su cuerpo ya usa nombres completos (`public.profiles`).
4. **Comprobación después de aplicarla:** repetir las consultas de la revisión (grants por tabla y
   funciones que puede ejecutar `anon`) y los avisos de seguridad. Lo esperado: solo `list_public_hearings`
   se puede ejecutar sin sesión. Recorrido rápido: sitio público (avisos, audiencias, encuesta, PQRS) y
   dashboard (Avisos de Remate, Audiencias, Encuestas, Usuarios, Mi perfil).
5. **Si algo falla:** el mensaje sería "permission denied for …". Se devuelve el permiso con otra
   migración (nunca solo a mano en el SQL Editor).

**Prueba que vigila las migraciones** (`src/lib/migrations.test.ts`, con
`import.meta.glob('/supabase/migrations/*.sql', { query: '?raw' })`, como `navigation/links.test.ts`): para
cada `create table public.<tabla>`, la misma migración debe tener `enable row level security` y
`revoke all on table public.<tabla> from anon, authenticated`. Las tablas antiguas que no lo cumplen van en
una lista de excepciones explícita, cubierta por esta migración. Una tabla nueva sin RLS o sin `revoke`
hace fallar `npm test`.

## Fase 2 · Edge Functions con las claves nuevas (hecha el 2026-11-03)

**Avance (2026-11-03):** las 6 funciones se desplegaron con el conector de Supabase, una a una, con las
mismas banderas de `verify_jwt`, y se probaron en producción:

| Función | Versión | Prueba |
|---|---|---|
| `submit-survey` | 15 | Encuesta respondida; las respuestas llegan al dashboard |
| `submit-request` | 21 | PQRS con radicado; acuse al ciudadano y aviso a la oficina |
| `password-reset` | 2 | Enlace por correo, contraseña nueva y aviso de cambio |
| `hearings-mailer` | 11 | Llamada del cron con respuesta 200 y sin errores (no había avisos ni recordatorios que enviar; la prueba de envío real se omitió) |
| `respond-request` | 13 | Respuesta a una PQRS; llega el correo |
| `manage-users` | 16 | Edición de nombre y restablecimiento de contraseña; el usuario cambió la temporal en Mi perfil |

**Claves antiguas desactivadas el 2026-11-03** (Settings → API Keys → "Disable JWT-based API keys";
Netlify ya usaba `sb_publishable_`). Después se repitieron las pruebas: Avisos de Remate, Audiencias,
encuesta, responder PQRS y modificar usuarios funcionaron, y el cron de audiencias de las 17:45 UTC respondió
200 sin correos fallidos. `verify_jwt` sigue activado en `manage-users` y `respond-request` sin problemas.
**Fase 2 terminada.**

Las claves antiguas (`anon`, `service_role`) se retiran a inicios de 2027. Las 6 funciones leen
`SUPABASE_SERVICE_ROLE_KEY` y dos de ellas (`manage-users`, `respond-request`) también `SUPABASE_ANON_KEY`.

1. **Un módulo compartido** `supabase/functions/_shared/keys.ts` con dos funciones: la clave secreta y la
   publicable. Leen `SUPABASE_SECRET_KEYS` y `SUPABASE_PUBLISHABLE_KEYS` (JSON, clave `default`) y fallan
   con un error claro si faltan. Sin volver a las claves antiguas: así una función mal migrada se nota al
   probar, no el día del retiro.
2. **Las 6 funciones** (`submit-request`, `submit-survey`, `manage-users`, `respond-request`,
   `hearings-mailer`, `password-reset`) usan ese módulo. En `manage-users` y `respond-request`, el cliente
   "como el usuario" usa la publicable y sigue enviando el JWT de quien llama.
3. **Sin cambios:** los cron de audiencias (usan `x-cron-secret`, no una clave de Supabase), el navegador
   (ya usa la publicable) y las banderas de despliegue (`--no-verify-jwt` en las 4 públicas; `verify_jwt`
   activado en `manage-users` y `respond-request`).
4. **Antes de desplegar:** confirmar en Edge Functions → Secrets que existen `SUPABASE_SECRET_KEYS` y
   `SUPABASE_PUBLISHABLE_KEYS`.
5. **Desplegar y probar cada flujo:** enviar una PQRS, responder una encuesta, crear o editar un usuario,
   responder o reenviar una PQRS, pedir y usar un enlace de recuperar contraseña, y ver que el siguiente
   envío de audiencias (cada 5 minutos) queda en `email_log` sin errores.
6. **Desactivar las claves antiguas** (Settings → API Keys → Legacy), que se puede revertir. Repetir las
   pruebas del punto 5. Si `manage-users` o `respond-request` responden "Invalid JWT", se reactivan las
   antiguas y se revisa `verify_jwt` (la otra opción de la decisión).

## Fase 3 · Contraseñas y captcha del login

**Avance (2026-11-03): código hecho en la rama, sin desplegar.** No hay PR todavía: Netlify no tiene
créditos de build. Hecho:

- `src/lib/password.ts`: letra a-z y número obligatorios, `PASSWORD_HINT` (Mi perfil y Crear contraseña
  nueva) y `captcha_failed` en español; pruebas en `password.test.ts`.
- `pages/Login.tsx` y `dashboard/profile/PasswordForm.tsx`: Turnstile (`CaptchaField`) y
  `options.captchaToken`, con el widget reiniciado tras cada intento. **Cambio respecto al plan:** si el
  widget no carga, se deja intentar sin token y Auth decide. Así las vistas previas (error 110200)
  siguen pudiendo iniciar sesión mientras el captcha de Auth esté apagado.
- `components/account/loginErrors.ts` (+ prueba): errores de inicio de sesión en español, que antes
  salían en inglés (`error.message`).
- Documentación: CLAUDE.md, `docs/modulos/mi-perfil.md`, Ayuda (`ayuda/data.ts`, con las cifras de
  `PASSWORD_MIN` / `PASSWORD_MAX`) y `docs/guia-despliegue.md`.

**Probado en local (2026-11-03):** iniciar sesión y cambiar la contraseña en Mi perfil funcionan con el
widget de Turnstile (captcha de Auth todavía apagado).

**Pendiente, en este orden. No activar nada en el panel antes de que el sitio esté desplegado:**

1. Desplegar el sitio (PR de la rama `seguridad-supabase` cuando Netlify tenga créditos).
2. En Supabase → Authentication, poner la política de contraseñas: mínimo 8 y "Letters and digits".
3. En Supabase → Authentication → Attack Protection, activar el captcha con Turnstile y la misma clave
   secreta de Turnstile.
4. Probar en producción: iniciar sesión, cambiar la contraseña en Mi perfil y recuperar la contraseña.
   Si falla, desactivar el captcha en ese mismo panel.

Si el captcha se activa antes de desplegar, nadie puede iniciar sesión: el sitio publicado no envía el
token.

**Contraseñas (letras y números):**

1. **App:** `newPasswordField` (`src/lib/password.ts`) exige además al menos una letra **sin tilde (a-z,
   A-Z)** y un número (0-9). Mensajes: "Debe incluir al menos una letra" y "Debe incluir al menos un
   número". Usar las mismas letras que cuenta Auth: una contraseña con solo "ñ" o letras con tilde pasaría
   en la app y Auth la rechazaría. Se aplica en Mi perfil y en Crear contraseña nueva. Pruebas en
   `password.test.ts`.
2. **Auth** (Authentication → Policies o Providers → Email): longitud mínima 8 y requisito "Letters and
   digits". Va después de desplegar la app, para que el usuario vea el mensaje en español antes que el
   error de Auth.
3. **Contraseñas temporales** de `manage-users`: ya tienen 14 caracteres con mayúscula, minúscula, número
   y símbolo. No cambian.
4. **Las contraseñas actuales siguen sirviendo:** la regla se aplica solo al crear o cambiar una.

**Captcha (Turnstile) en el login:**

1. **Login** (`pages/Login.tsx`): agregar `CaptchaField` (el mismo de PQRS y Encuesta), enviar el token en
   `signInWithPassword({ email, password, options: { captchaToken } })` y reiniciar el widget después de un
   intento fallido (los tokens son de un solo uso).
2. **Mi perfil → Contraseña** (`PasswordForm`): también llama a `signInWithPassword` para comprobar la
   contraseña actual, así que necesita su propio `CaptchaField` y token.
3. **Errores en español:** agregar `captcha_failed` (y los códigos de captcha que devuelva Auth) a los
   mensajes de `src/lib/password.ts`, y mostrar en el login un mensaje en español en vez de
   `error.message`.
4. **Orden en producción:**
   1. Fusionar y desplegar el código. Mientras Auth no pida captcha, enviar el token no hace nada.
   2. En Authentication → Attack Protection, activar el captcha con Turnstile y la misma clave secreta de
      Turnstile de las Edge Functions.
   3. Probar en producción: iniciar sesión, cambiar la contraseña en Mi perfil y recuperar la contraseña.
   4. Si algo falla, desactivar el captcha en ese mismo panel.
5. **Consecuencia aceptada:** mientras esté activo, en las vistas previas de Netlify no se puede iniciar
   sesión (Turnstile rechaza esos dominios con el error 110200). Se agrega a la lista de "ruido esperado"
   de CLAUDE.md.

## Documentación en los mismos commits

- **CLAUDE.md:** corregir "Table grants" (la protección viene del interruptor apagado más el `revoke all` y
  los grants de cada migración, no de un cambio de Supabase); claves nuevas en las Edge Functions; captcha
  en Login y Mi perfil; regla de contraseñas.
- **`docs/modulos/mi-perfil.md`** y **`src/dashboard/ayuda/data.ts`:** la regla de contraseñas (letras y
  números) y el captcha al iniciar sesión, en lenguaje para el personal.
- **`docs/guia-despliegue.md`:** las variables `SUPABASE_SECRET_KEYS` / `SUPABASE_PUBLISHABLE_KEYS`, el
  captcha de Auth y la política de contraseñas en la lista de configuración del panel.
- **`docs/plan-pruebas.md`:** referencia a este plan antes de la fase de base de datos (pgTAP).

## Después de este plan

La fase de **pruebas de base de datos** de `docs/plan-pruebas.md` (pgTAP con `supabase test db`): RLS por
tabla, triggers y funciones, comprobando también lo que este plan cierra.
