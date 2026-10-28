# Plan: correcciones de la revisión de código del 2026-10-28 (pendiente)

> Histórico: el funcionamiento vigente de cada sección está en [modulos/](modulos/README.md).

La revisión de código (`/code-review`) sobre `main` (commit `f81d39f`) dejó 10 hallazgos. Este plan los
corrige uno a uno en la rama `correcciones-revision`, en orden de gravedad: un commit por hallazgo, cada uno
con `npm run lint`, `npm test` y `npm run build`. Si un cambio toca una regla, un permiso o un texto para el
funcionario, el mismo commit actualiza `docs/modulos/` y `src/dashboard/ayuda/data.ts`.

## Decisiones tomadas (2026-10-28)

1. "Última actualización" por pestaña: **migración nueva** con una fecha para cada grupo de datos.
2. Correo personal: **solo caracteres ASCII**, validado en zod y en un CHECK de la base, con mensaje en el
   campo.
3. Cancelación de peticiones: unificar con `signal.throwIfAborted()` en las API. Los `let active` de los
   efectos se quedan (es el patrón del dashboard, en más de 15 sitios).
4. Ayuda: `aria-controls` solo en la pestaña activa; no se montan todas las guías.

## 1. "Ver información personal" con el juzgado de cada fila

- Hoy `UsersPage.tsx` calcula `canViewPersonal = can('usuarios.datos_personales')` una vez, sin juzgado, y
  `UsersTable.tsx` lo aplica a todas las filas. `get_user_personal_info()` comprueba el permiso con el
  juzgado del usuario consultado (0 si no tiene).
- Cambio: decidir por fila con `can('usuarios.datos_personales', user.court)`. Si quien consulta tiene
  alcance de juzgado y la fila es de otro juzgado o no tiene juzgado, la opción aparece deshabilitada con
  `disabledReason` ("Solo puede consultar usuarios de su juzgado"), según la convención de `ActionMenu`.
- Revisar la regla "sin acciones no hay columna" (comentario en `UsersTable.tsx`): la columna existe si
  alguna fila tiene alguna acción.
- Antes: confirmar en `20261027120000_profile_personal_info.sql` qué juzgado recibe `has_permission` cuando
  el usuario no tiene, para que el cliente use la misma regla.
- Docs: `modulos/usuarios-roles-permisos.md` ("Ver información personal").

## 2. Aviso de privacidad sin nombres de roles

- `profile/personalData.ts` dice "el Director de oficina y el Administrador de Sistema pueden
  consultarlos". `ayuda/data.ts` repite "(hoy, el Director de oficina y el Administrador de Sistema)" en dos
  lugares.
- Cambio: describir el permiso ("quienes tengan el permiso **Ver información personal**"). En Ayuda, quitar
  el "hoy, …" y remitir a la tabla "Quién puede hacer qué", que se lee en vivo.
- Docs: `modulos/mi-perfil.md` (la mención "hoy director_oficina" pasa a ser una asignación con fecha, o se
  remite a `usuarios-roles-permisos.md`).

## 3. "Última actualización" separada por pestaña (migración nueva)

- Hoy las dos pestañas y `PersonalInfoModal` muestran el `updated_at` de la fila: guardar una pestaña cambia
  la fecha de la otra.
- Migración nueva sobre `profile_personal_info`:
  - Columnas `personal_updated_at` y `emergency_updated_at` (timestamptz, nulas).
  - Relleno inicial: cada una toma el `updated_at` actual si su grupo tiene algún dato; si no, null.
  - Trigger `before insert or update`: marca `personal_updated_at` solo si cambió alguna columna de
    Información personal (dirección, celular, correo, EPS), y `emergency_updated_at` solo si cambió alguna del
    contacto de emergencia (nombre, parentesco, celular). "Quitar estos datos" cuenta como cambio.
  - Las columnas no se pueden escribir desde el navegador: sin grant de insert ni update; el grant de select
    se amplía a las dos.
  - `get_user_personal_info()` devuelve las dos fechas (recrear la función conservando su `security
    definer`, `search_path` y grants).
- UI: cada formulario muestra su propia fecha; el modal de Usuarios muestra una fecha por bloque.
- Docs: `modulos/mi-perfil.md` y CLAUDE.md (sección Mi perfil) si describen las columnas.

## 4. El error 23503 no siempre es la EPS

- `profile/personalApi.ts` traduce todo 23503 a "Esa EPS ya no existe".
- Cambio: distinguir por el nombre de la restricción (en `error.message` / `error.details`): la de `eps_id`
  da el mensaje de la EPS; la de `user_id` (`profile_personal_info_user_id_fkey`) da "No se encontró su
  perfil: recargue la página o comuníquese con el administrador"; cualquier otra, el error genérico.
- La traducción de errores pasa a una función pura en un `.ts`, con prueba en Vitest.

## 5. Correo personal solo ASCII

- El cliente pasa el correo a minúsculas con `toLowerCase()` de JS y la base exige
  `personal_email = lower(personal_email)`: con caracteres no ASCII pueden no coincidir.
- Cambio:
  - zod (`profile/personalSchema.ts`): rechazar caracteres fuera de ASCII con el mensaje "Escriba el correo
    sin tildes ni caracteres especiales".
  - Base: en la misma migración del punto 3, un CHECK que exige ASCII en `personal_email` (comprobar antes
    que ninguna fila existente lo incumpla).
  - `personalApi.ts`: el 23514 de las restricciones del correo se muestra como error del campo correo, no
    como el mensaje genérico.
  - Pruebas del schema en Vitest.
- Docs: `modulos/mi-perfil.md` (reglas de los campos) y el CLAUDE.md si menciona la regla.

## 6. Cargar la información personal solo cuando se necesita

- Hoy `ProfilePage.tsx` llama a `usePersonalInfo()` al montar: dos consultas (`profile_personal_info` y
  `eps_entities`) en cada visita, también durante el cambio de contraseña temporal.
- Cambio: el hook recibe `enabled` y solo consulta tras abrir por primera vez Información personal o
  Contacto de emergencia; después se queda cargado (los paneles siguen montados). Mientras
  `must_change_password` esté activo no consulta.
- Comprobar en la pestaña Red que Cuenta y Contraseña no hacen esas consultas.

## 7. Quitar el `scrollIntoView` de `Tabs`

- El efecto de `components/ui/Tabs.tsx` venía de la fila de Ayuda con desplazamiento horizontal. La fila
  actual salta de línea y está oculta por debajo de `sm`: solo mueve la página en vertical (por ejemplo, al
  pasar de Cuenta a Contraseña tras guardar).
- Cambio: quitar el efecto y el mapa `refs` si nada más lo usa (revisar flechas, Home/End y `TabsMenu`).
- Comprobar Mi perfil (guardar Cuenta abajo no hace saltar la página) y Ayuda.

## 8. Cancelación uniforme en las API

- `if (signal.aborted) throw new DOMException(...)` se repite con dos textos ('Aborted' y 'Petición
  cancelada') en `dashboard/encuestas/api.ts`, `dashboard/audiencias/api.ts`, `dashboard/pqrs/api.ts`,
  `dashboard/remates/api.ts` y `components/audiencias/api.ts`.
- Cambio: `signal.throwIfAborted()` en todos (confirmar que el `lib` de `tsconfig.app.json` lo incluye).
  Revisar que quien captura el error siga reconociendo `AbortError`.

## 9. Comentarios de `index.css` en su sitio

- El bloque `illustration-still` quedó entre el comentario "Texto más pequeño dentro de una ilustración" y
  `illustration-compact`.
- Cambio: el comentario vuelve encima de `illustration-compact` e `illustration-still` lleva el suyo. Sin
  cambios visuales.

## 10. `aria-controls` en Ayuda

- Ayuda solo monta el panel de la guía abierta, pero `Tabs` pone `aria-controls` en todas las pestañas.
- Cambio: prop en `Tabs` para indicar que solo existe el panel activo (por ejemplo `panels="active"`); en ese
  modo, `aria-controls` va solo en la pestaña seleccionada. Mi perfil sigue igual (todos los paneles
  montados).

## Cierre

- `/code-review` de nuevo sobre la rama.
- Aplicar la migración del punto 3 y 5 en Supabase y probar en el navegador Mi perfil, Usuarios y Ayuda.
- Actualizar el CLAUDE.md donde cambie lo que describe y fusionar con `main`.
