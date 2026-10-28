# Ingreso y Mi perfil

Documento vivo: describe cómo funciona **hoy** el ingreso y el perfil propio. Si un cambio modifica una
regla, este archivo se actualiza en el mismo commit.

## Qué es

Inicio de sesión al dashboard y la página donde cada usuario cambia su nombre, su cargo y su contraseña, y
registra su información personal y su contacto de emergencia.

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
  hasta que el usuario **guarde un cargo** (pestaña Cuenta; al guardar pasa sola a Contraseña) y **cambie la
  contraseña**. `complete_password_change()` rechaza con `position_required` si no hay cargo. Información
  personal y Contacto de emergencia no se exigen.

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

Pestañas (`components/ui/Tabs`, compartido con Ayuda; en celular, por debajo de 640 px, es un botón con la
pestaña abierta que despliega la lista, `TabsMenu`), la abierta en `?pestana=` (sin parámetro, Cuenta;
en el primer ingreso con cargo ya guardado, Contraseña). Los paneles quedan montados y solo se ocultan:
cambiar de pestaña no pierde lo escrito. Cada pestaña guarda por separado.

| Pestaña | `?pestana=` | Contenido |
|---|---|---|
| Cuenta | (ninguno) o `cuenta` | Nombre, cargo, correo (`ProfileNameForm`) |
| Información personal | `informacion-personal` | Dirección, celular, correo personal, EPS (`PersonalInfoForm`) |
| Contacto de emergencia | `contacto-emergencia` | Nombre, parentesco, celular (`EmergencyContactForm`) |
| Contraseña | `contrasena` | `PasswordForm` |

### Cuenta y contraseña

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
- `saveProfile` actualiza el menú y el saludo sin recargar.

### Información personal y contacto de emergencia (plan en `docs/plan-perfil-informacion-personal.md`)

Tabla `profile_personal_info` (una fila por usuario, `user_id` → `profiles`, se borra con el perfil),
aparte de `profiles` para que `list_users()` y `get_my_access()` no la toquen. **Todos los campos son
opcionales** (null); cada regla se aplica solo si el campo tiene valor.

| Dato | Regla | Dónde vive (cambiar juntos) |
|---|---|---|
| Dirección de residencia | Una línea, 5 a 200 caracteres | `profile/personalSchema.ts` · `profile_personal_info_address_chk` |
| Celular (propio y del contacto) | 10 dígitos que empiezan por 3; se escribe con espacios, guiones o +57 y se guardan solo los dígitos | `profile/personalData.ts` (`normalizePhone`, `PHONE_PATTERN`) · `profile_personal_info_mobile_chk` / `_emergency_phone_chk` |
| Correo personal | Formato de correo, minúsculas, máx. 254, solo ASCII (sin tildes ni eñes, así `toLowerCase()` y `lower()` coinciden); aviso (no bloqueo) si es el de la cuenta. Si la base lo rechaza, el error sale junto al campo (`personalErrors.ts`) | `personalSchema.ts` (`EMAIL_CHARS`) · `profile_personal_info_email_chk` / `_email_ascii_chk` |
| EPS | De `eps_entities` (26 al crearla, agrupadas por `regime`, "Otra" al final); las inactivas no se ofrecen, salvo la actual | Catálogo en la base (SQL Editor) |
| Nombre del contacto | Misma regla del nombre del perfil | `profile/schema.ts` (`buildNameSchema`) · `profile_personal_info_emergency_name_chk` |
| Parentesco | `madre`, `padre`, `conyuge`, `hijo`, `hermano`, `otro_familiar`, `amigo`, `otro` | `RELATIONSHIPS` en `personalData.ts` · `profile_personal_info_relationship_chk` |

- Avisos que no impiden guardar: contacto con nombre y sin celular; celular del contacto igual al propio;
  correo personal igual al de la cuenta.
- Textos de ayuda junto a los campos (`PERSONAL_HELP` en `personalData.ts`), sin casilla de aceptación
  (decisión del 2026-10-27). Dicen quién puede consultar los datos: si cambia quién tiene
  `usuarios.datos_personales`, actualizarlos (y la guía de Ayuda).
- Permisos de la tabla: `authenticated` lee, inserta y actualiza **solo su fila** (políticas `_own`) y solo
  las columnas editables; sin `delete` ("Quitar estos datos" deja la pestaña en null); nada a `anon` ni a
  `service_role`. El navegador hace insert la primera vez y update después (no upsert: no hay grant de
  update sobre `user_id`).
- "Última actualización": cada pestaña tiene su fecha (`personal_updated_at`, `emergency_updated_at`),
  que pone el trigger `profile_personal_info_section_dates` solo cuando cambia alguna columna de su grupo
  y deja en null cuando el grupo queda vacío. No se escriben desde el navegador. Los grupos de columnas se
  repiten en `personalApi.ts` (`PERSONAL_COLUMNS`, `EMERGENCY_COLUMNS`): cambiar los dos juntos.
  `updated_at` sigue siendo la fecha de la fila. El modal de Usuarios muestra una fecha por bloque.
- Consulta de otros: solo lectura, en Usuarios → "Ver información personal", con
  `get_user_personal_info()` y el permiso `usuarios.datos_personales` (a quién está asignado: ver
  [usuarios-roles-permisos.md](usuarios-roles-permisos.md); superadmin implícito). Los textos para el
  usuario (aviso de la pestaña y Ayuda) nombran el permiso, nunca roles, porque la asignación cambia en
  Roles sin tocar código.

## Archivos y migraciones

- `src/dashboard/profile/` (`ProfileProvider`, `ProfileNameForm`, `PasswordForm`, `PersonalInfoForm`,
  `EmergencyContactForm`, `PersonalSectionCard`, `usePersonalInfo`, `personalApi.ts`, `personalSchema.ts`,
  `personalData.ts`), `pages/ProfilePage`, `components/ui/Tabs`, `usuarios/PersonalInfoModal`.
- Recuperar: `src/pages/RecuperarContrasena.tsx`, `src/pages/RestablecerContrasena.tsx`,
  `src/components/account/`, `src/lib/password.ts`, `supabase/functions/password-reset`,
  `supabase/functions/_shared/emails/account.ts`.
- Migraciones: `20261005120000_profiles`, `20261005130000_profiles_update_own_name`,
  `20261005140000_profiles_full_name_check`, `20261013120000_hearing_format` (cargos),
  `20261027120000_profile_personal_info` (información personal, EPS, `usuarios.datos_personales`),
  `20261028120000_personal_info_section_dates` (fecha por pestaña), `20261028130000_personal_email_ascii`
  (correo solo ASCII).

## Preguntas frecuentes (desarrollo)

- **No puedo seguir después del primer ingreso.** Falta guardar el cargo antes de cambiar la contraseña.
- **Falta un cargo en la lista.** Se agrega en `job_positions` desde el SQL Editor.
- **Falta una EPS o cambió.** Se agrega en `eps_entities` desde el SQL Editor (con su `regime`); una que
  ya no opera se marca `is_active = false`, no se borra (puede estar registrada por usuarios).
- **"permission denied" en `profile_personal_info`.** Revisar que la columna esté en los grants de
  insert/update de la migración `20261027120000`.
- **Un usuario olvidó la contraseña.** Usa "¿Olvidó su contraseña?" en `/login`; si no le llega el
  correo, el administrador usa "Restablecer contraseña" en Usuarios.
- **No llega el enlace.** Revisar `email_log` (`kind = password_reset`): sin fila, la cuenta no existe,
  está desactivada, no tiene rol o se alcanzó el límite; con `failed`, revisar Resend.
- **El enlace abre "ya no es válido".** Venció (1 hora), ya se usó o se pidió otro después (solo vale
  el último).
