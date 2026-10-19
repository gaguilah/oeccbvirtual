# Ingreso y Mi perfil

Documento vivo: describe cómo funciona **hoy** el ingreso y el perfil propio. Si un cambio modifica una
regla, este archivo se actualiza en el mismo commit.

## Qué es

Inicio de sesión al dashboard y la página donde cada usuario cambia su nombre, su cargo y su contraseña.

| Dónde | Ruta | Quién |
|---|---|---|
| Inicio de sesión | `/login` | Cuentas creadas por el administrador |
| Recuperar contraseña | `/recuperar-contrasena` y `/restablecer-contrasena` | Cuentas activas y con rol |
| Mi perfil | `/dashboard/perfil` (`group: 'account'`: ni en el menú ni en Inicio) | Cualquier usuario con sesión |

## Ingreso

- Sin registro público: la cuenta y la contraseña temporal las da el administrador en Usuarios (ver
  [usuarios-roles-permisos.md](usuarios-roles-permisos.md)).
- `ProtectedRoute` lleva a `/login` con `state.from` y, tras ingresar, vuelve a esa ruta del dashboard.
- Primer ingreso (`must_change_password`): todas las rutas salvo la Ayuda llevan a Mi perfil con el menú deshabilitado
  hasta que el usuario **guarde un cargo** y **cambie la contraseña**. `complete_password_change()`
  rechaza con `position_required` si no hay cargo.

## Recuperar contraseña (plan en `docs/plan-recuperar-contrasena.md`)

| Valor | Cifra | Dónde vive |
|---|---|---|
| Vigencia del enlace | 1 hora, un solo uso | Panel de Auth (OTP expiry) · texto en `_shared/emails/account.ts` y en la página |
| Límite por correo | 1 cada 5 minutos y 5 al día (por tipo de correo) | `MIN_INTERVAL_MS` / `DAILY_LIMIT` en `password-reset`, contado en `email_log` |
| Reglas de contraseña | 8 a 72 caracteres | `src/lib/password.ts` (compartido con Mi perfil) |

1. `/login` → "¿Olvidó su contraseña?" → `/recuperar-contrasena`: correo + Turnstile → Edge Function
   `password-reset` (`--no-verify-jwt`), acción `request`. Respuesta **siempre igual** (no revela
   cuentas); solo se envía si hay cuenta (`generateLink` tipo `recovery` no falla), el perfil está
   activo y con rol, y no pasó el límite. El correo (`passwordResetEmail`, `email_log.kind =
   password_reset`) enlaza a `<origen>/restablecer-contrasena?token_hash=…&type=recovery`; el origen es
   el de la petición si está en `ALLOWED_ORIGINS` (sitio y `http://localhost:5173`), si no `SITE_URL`.
2. `/restablecer-contrasena`: lee el token una vez, lo quita de la dirección y lo valida con
   `verifyOtp` (inicia la sesión; con `useRef` para no gastarlo dos veces en StrictMode). Inválido →
   "Este enlace ya no es válido" + "Pedir otro enlace".
3. Guardar: `updateUser({ password })`; después, sin bloquear: `signOut({ scope: 'others' })`,
   `complete_password_change()` (quita la marca de temporal; sin cargo falla y Mi perfil lo pide) y la
   acción `notify-changed` (identifica al usuario con su token; `passwordChangedEmail`, `kind =
   password_changed`).
4. "Restablecer contraseña" en Usuarios sigue existiendo para quien no tenga acceso a su correo.

## Mi perfil

| Dato | Regla | Dónde vive (cambiar juntos) |
|---|---|---|
| Nombre | Letras (con tildes), separados por un espacio, guion, apóstrofo o ". "; 3 a 120 caracteres | `profile/schema.ts` · restricción `profiles_full_name_format` |
| Cargo | De la lista `job_positions` (se administra en el SQL Editor) | `profiles.position_id` |
| Correo | Solo lectura | Auth |
| Contraseña | 8 a 72 caracteres, distinta de la actual; pide la actual y la verifica con `signInWithPassword` | `src/lib/password.ts` (reglas y errores de Auth en español) · `profile/schema.ts` · `profile/api.ts` |

- El usuario solo puede actualizar `full_name` y `position_id` de su propia fila (grant por columna +
  política de fila propia). Nunca `grant update on profiles` completo.
- El cargo se copia en las audiencias al registrar la grabación (formato de referencia cruzada): cambiar
  el cargo después no altera los formatos ya generados.
- `saveFullName` actualiza el menú y el saludo sin recargar.

## Archivos y migraciones

- `src/dashboard/profile/` (`ProfileProvider`, `ProfileNameForm`, `PasswordForm`), `pages/ProfilePage`.
- Recuperar: `src/pages/RecuperarContrasena.tsx`, `src/pages/RestablecerContrasena.tsx`,
  `src/components/account/`, `src/lib/password.ts`, `supabase/functions/password-reset`,
  `supabase/functions/_shared/emails/account.ts`.
- Migraciones: `20261005120000_profiles`, `20261005130000_profiles_update_own_name`,
  `20261005140000_profiles_full_name_check`, `20261013120000_hearing_format` (cargos).

## Preguntas frecuentes (desarrollo)

- **No puedo seguir después del primer ingreso.** Falta guardar el cargo antes de cambiar la contraseña.
- **Falta un cargo en la lista.** Se agrega en `job_positions` desde el SQL Editor.
- **Un usuario olvidó la contraseña.** Usa "¿Olvidó su contraseña?" en `/login`; si no le llega el
  correo, el administrador usa "Restablecer contraseña" en Usuarios.
- **No llega el enlace.** Revisar `email_log` (`kind = password_reset`): sin fila, la cuenta no existe,
  está desactivada, no tiene rol o se alcanzó el límite; con `failed`, revisar Resend.
- **El enlace abre "ya no es válido".** Venció (1 hora), ya se usó o se pidió otro después (solo vale
  el último).
