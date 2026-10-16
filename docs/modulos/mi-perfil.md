# Ingreso y Mi perfil

Documento vivo: describe cómo funciona **hoy** el ingreso y el perfil propio. Si un cambio modifica una
regla, este archivo se actualiza en el mismo commit.

## Qué es

Inicio de sesión al dashboard y la página donde cada usuario cambia su nombre, su cargo y su contraseña.

| Dónde | Ruta | Quién |
|---|---|---|
| Inicio de sesión | `/login` | Cuentas creadas por el administrador |
| Mi perfil | `/dashboard/perfil` (`group: 'account'`: ni en el menú ni en Inicio) | Cualquier usuario con sesión |

## Ingreso

- Sin registro público ni recuperación de contraseña por correo: la cuenta y la contraseña temporal las
  da el administrador en Usuarios (ver [usuarios-roles-permisos.md](usuarios-roles-permisos.md)).
- `ProtectedRoute` lleva a `/login` con `state.from` y, tras ingresar, vuelve a esa ruta del dashboard.
- Primer ingreso (`must_change_password`): todas las rutas salvo la Ayuda llevan a Mi perfil con el menú deshabilitado
  hasta que el usuario **guarde un cargo** y **cambie la contraseña**. `complete_password_change()`
  rechaza con `position_required` si no hay cargo.

## Mi perfil

| Dato | Regla | Dónde vive (cambiar juntos) |
|---|---|---|
| Nombre | Letras (con tildes), separados por un espacio, guion, apóstrofo o ". "; 3 a 120 caracteres | `profile/schema.ts` · restricción `profiles_full_name_format` |
| Cargo | De la lista `job_positions` (se administra en el SQL Editor) | `profiles.position_id` |
| Correo | Solo lectura | Auth |
| Contraseña | 8 a 72 caracteres, distinta de la actual; pide la actual y la verifica con `signInWithPassword` | `profile/schema.ts` · `profile/api.ts` (errores de Auth en español) |

- El usuario solo puede actualizar `full_name` y `position_id` de su propia fila (grant por columna +
  política de fila propia). Nunca `grant update on profiles` completo.
- El cargo se copia en las audiencias al registrar la grabación (formato de referencia cruzada): cambiar
  el cargo después no altera los formatos ya generados.
- `saveFullName` actualiza el menú y el saludo sin recargar.

## Archivos y migraciones

- `src/dashboard/profile/` (`ProfileProvider`, `ProfileNameForm`, `PasswordForm`), `pages/ProfilePage`.
- Migraciones: `20261005120000_profiles`, `20261005130000_profiles_update_own_name`,
  `20261005140000_profiles_full_name_check`, `20261013120000_hearing_format` (cargos).

## Preguntas frecuentes (desarrollo)

- **No puedo seguir después del primer ingreso.** Falta guardar el cargo antes de cambiar la contraseña.
- **Falta un cargo en la lista.** Se agrega en `job_positions` desde el SQL Editor.
- **Un usuario olvidó la contraseña.** El administrador usa "Restablecer contraseña" en Usuarios.
