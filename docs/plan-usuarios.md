# Plan: usuarios, roles y permisos (fases 1 a 3 construidas el 2026-10-05)

Plan 2 de la hoja de ruta de `docs/plan-dashboard.md`. Va antes de cualquier sección con datos privados: las reglas (RLS) de Avisos de Remate, PQRS, Encuestas y Audiencias se apoyarán en lo que deja listo este plan. Rama: `dashboard` (la misma de la base del dashboard).

## Decisiones tomadas

| Tema | Decisión |
| --- | --- |
| Roles por usuario | **Uno** |
| Alcance | Los permisos dependen de la **dependencia** del usuario: Juzgado 1, Juzgado 2 u Oficina |
| Roles iniciales | `superadmin`, `juzgado`, `oficina` |
| `superadmin` | Todo, siempre (también los permisos que se agreguen después). Primer usuario: la cuenta del propietario, que ya existe en Supabase Auth |
| `juzgado` | CRUD de lo que corresponde a **su** juzgado, en cada sección |
| `oficina` | **Ve** todo de los dos juzgados; **edita** solo algunas cosas, según se defina en cada sección |
| Cuentas | Las crea **solo el `superadmin`** desde el dashboard (a partir de un listado que ya tiene), con **contraseña temporal** y cambio obligatorio en el primer ingreso. Edge Function; nunca desde el sitio público. El registro público ya está desactivado en Supabase |
| Quién ve Usuarios | Solo `superadmin` (por ahora) |
| Quién gestiona usuarios, roles y permisos | Solo `superadmin` (por ahora) |
| Etiqueta de la dependencia | "Juzgado 1", "Juzgado 2" y "**Oficina**" (no el nombre oficial completo) |
| Secciones de administración | Usuarios, Roles y Permisos, en el menú bajo "Administración" |

## Modelo

La idea central: **qué puede hacer** un usuario lo dice su rol (permisos), y **sobre qué juzgado** lo dice el alcance del rol más el juzgado del usuario.

```
                 ┌──────────────┐        ┌─────────────────────┐
                 │ permissions  │◄──────►│ role_permissions    │
                 │ code (pk)    │        │ role_id, permission │
                 │ module       │        └──────────┬──────────┘
                 │ name, desc   │                   │
                 └──────────────┘        ┌──────────▼──────────┐
                                         │ roles               │
                                         │ code, name          │
                                         │ scope: all | court  │
                                         │ is_system           │
                                         └──────────▲──────────┘
                                                    │ role_id
 auth.users ──(id)── profiles: full_name, role_id, court (1 | 2 | null), active
```

### Tablas (migración nueva)

- **`permissions`**: el catálogo de acciones.
  - `code text primary key`, con forma `<módulo>.<acción>` (`usuarios.gestionar`, `remates.editar`).
  - `module text` para agrupar en pantalla, `name text`, `description text`.
  - Cada sección agrega sus permisos **en su propia migración** (por ejemplo, el plan de Avisos de Remate agrega `remates.ver`, `remates.crear`, `remates.editar`, `remates.eliminar` y `remates.publicar`).
- **`roles`**
  - `id uuid`, `code text unique` (`superadmin`, `juzgado`, `oficina`), `name`, `description`.
  - `scope text check (scope in ('all', 'court'))`:
    - `all`: sus permisos aplican a los dos juzgados (`superadmin`, `oficina`);
    - `court`: sus permisos aplican solo al juzgado del usuario (`juzgado`).
  - `is_system boolean`: `superadmin` no se puede borrar, renombrar ni quitarle permisos (los tiene todos de forma implícita).
- **`role_permissions`**: `(role_id, permission_code)` como llave primaria, con borrado en cascada.
- **`profiles`** (columnas nuevas):
  - `role_id uuid references roles` (null = sin acceso al dashboard todavía);
  - `court smallint check (court in (1, 2))`, el mismo valor que `auction_notices.court` y `src/lib/courts.ts`;
  - `active boolean not null default true`;
  - `must_change_password boolean not null default false`: la Edge Function lo pone en `true` al crear la cuenta con contraseña temporal.
  - Regla (trigger): si el rol es de alcance `court`, `court` es obligatorio; si es `all`, `court` queda en null.
  - Estas columnas **no** están en el `grant update (full_name)`: nadie se cambia el rol, el juzgado ni el estado desde el navegador.

### Funciones

- **`public.has_permission(p_permission text, p_court smallint default null) returns boolean`**: la pieza que usarán todas las políticas.
  1. El usuario en sesión tiene perfil activo y rol; si no, `false`.
  2. Rol `superadmin`: `true`.
  3. El rol no tiene el permiso: `false`.
  4. Con `p_court` y rol de alcance `court`: `true` solo si `profiles.court = p_court`.
  - Es `security definer` (necesita leer roles y permisos sin depender de las políticas de esas tablas), con `search_path = ''`, `stable`, y solo mira la fila del propio usuario (`auth.uid()`). `EXECUTE` solo para `authenticated`.
  - Ejemplo de uso en una sección futura: `using (public.has_permission('remates.editar', court))`.
- **`public.get_my_access() returns jsonb`**: `{ role, role_name, scope, court, active, permissions: [...] }` del usuario en sesión, para que el dashboard arme el menú y oculte botones. Para `superadmin` devuelve todos los códigos del catálogo.
- **`public.complete_password_change()`**: la llama Mi perfil después de un cambio de contraseña exitoso y pone `must_change_password = false` en la fila propia (`security definer`, solo esa columna, solo `auth.uid()`). Es una ayuda de flujo, no una barrera de seguridad: quien la llame sin cambiar la contraseña solo se salta el aviso y conserva una contraseña que conoce el administrador.
- **`public.list_users()`**: perfiles + correo (de `auth.users`) + rol + último ingreso, solo si `has_permission('usuarios.ver')`. Los correos viven en `auth.users`, que el navegador no puede leer; por eso una función y no una consulta directa.

### Protecciones en la base de datos

- No se puede quitar el rol `superadmin` ni desactivar al **último** `superadmin` activo (trigger).
- Solo un `superadmin` puede asignar el rol `superadmin`.
- Un rol con usuarios asignados no se puede borrar (llave foránea sin cascada): primero se reasignan.
- Lectura de `roles`, `permissions` y `role_permissions`: cualquier usuario autenticado (el dashboard necesita los nombres). Escritura: solo con `roles.gestionar` / `permisos.gestionar`, y nunca sobre roles `is_system`.

### Permisos de este plan

| Código | Para qué |
| --- | --- |
| `usuarios.ver` | Ver la lista de usuarios |
| `usuarios.gestionar` | Crear, editar, desactivar y reactivar usuarios |
| `roles.ver` | Ver roles y sus permisos |
| `roles.gestionar` | Crear, editar y borrar roles; marcar sus permisos |
| `permisos.ver` | Ver el catálogo de permisos |
| `permisos.gestionar` | Editar nombre y descripción de un permiso |

Solo `superadmin` los tiene, y así se queda por ahora (decisión del 2026-10-05): ni `oficina` ni `juzgado` ven ni gestionan usuarios, roles o permisos. `juzgado` y `oficina` empiezan sin permisos: los reciben cuando se construya cada sección (o desde la pantalla de Roles).

### Primer superadmin

La misma migración busca la cuenta del propietario en `auth.users` por correo, le crea o completa su fila en `profiles` y le asigna `superadmin` con `court` null. Si el correo no existe, la migración falla con un mensaje claro.

## ¿Se pueden crear roles y permisos desde el dashboard?

- **Roles: sí, completo.** Crear, renombrar, elegir el alcance (todos los juzgados o solo el del usuario), marcar sus permisos y borrar (si no tiene usuarios). Así, si mañana hace falta un rol "consulta" o "secretaría", no hace falta programar.
- **Permisos: ver y editar, pero no crear.** Un permiso solo tiene efecto si el código lo revisa: una política RLS (`has_permission('remates.publicar', court)`) y la interfaz (mostrar u ocultar el botón "Publicar"). Un permiso creado desde la pantalla no estaría conectado a nada y daría la falsa impresión de proteger algo. Por eso:
  - los permisos **nacen con cada sección**, en su migración, junto con las políticas que los usan;
  - la pantalla de Permisos muestra el catálogo agrupado por módulo, qué roles tiene cada uno, y deja **editar su nombre y descripción** (lo que ve quien asigna permisos).

## Fases

### Fase 1: base en la base de datos y acceso en el dashboard

- Migración: tablas, columnas de `profiles`, funciones, triggers, políticas, roles iniciales, permisos de este plan y el primer superadmin.
- `src/dashboard/access/`: `AccessProvider` (dentro de `ProfileProvider`) llama `get_my_access()` una vez y expone `useAccess()` → `{ role, scope, court, can(permission, court?) }`.
- `navigation/links.ts`: cada opción declara el permiso que la muestra (`permission: 'usuarios.ver'`). El menú y las tarjetas de Inicio se filtran con `can()`.
- `RequirePermission`: envuelve cada ruta de sección; sin permiso muestra "No tiene acceso a esta sección" (aunque se escriba la dirección a mano).
- Sin rol o con la cuenta desactivada: el dashboard muestra solo un aviso ("Su cuenta no tiene acceso todavía. Comuníquese con un administrador.") y cerrar sesión.
- Menú: debajo del nombre, el rol y la dependencia ("Juzgado · Juzgado 1", "Oficina").
- **Contraseña temporal:** con `must_change_password = true`, todas las rutas del dashboard llevan a Mi perfil con un aviso fijo ("Cambie la contraseña temporal para continuar") y el menú queda deshabilitado hasta que la cambie (pidiendo la actual, que es la temporal).
- Recordatorio: ocultar en la interfaz es comodidad; la protección real son las políticas.

### Resultado de la fase 1 (2026-10-05)

- Migración `supabase/migrations/20261005150000_roles_permissions.sql`: tablas, columnas de `profiles` (`role_id`, `court`, `active`, `must_change_password`), `has_permission`, `get_my_access`, `complete_password_change`, triggers (juzgado según alcance, último superadmin, roles del sistema), RLS, los 6 permisos de administración, los 3 roles y el primer superadmin. **Pendiente de aplicar** (desde esta red la CLI no llega a Postgres).
- Dashboard: `src/dashboard/access/` (`AccessProvider`, `useAccess().can()`, `RequirePermission`, `NoAccess`), `permission` en cada opción de `navigation/links.ts`, Roles y Permisos en el menú (como "Pronto"), rol y juzgado bajo el nombre en el menú, contraseña temporal (redirige a Mi perfil y deshabilita el menú hasta cambiarla), `auth/useSignOut`.
- `superadmin` ve todas las opciones, aunque sus permisos (`remates.ver`, `pqrs.ver`…) aún no existan en el catálogo: los crea la migración de cada sección.
- Probado en headless Edge con `get_my_access` simulado: superadmin, juzgado sin permisos ("Todavía no tiene secciones asignadas"), juzgado con `pqrs.ver`, dirección sin permiso ("No tiene acceso a esta sección"), sin perfil, desactivado, error al cargar (con "Intentar de nuevo") y contraseña temporal. No probado contra Supabase real.

### Fase 2: sección Usuarios (`/dashboard/usuarios`)

- **Lista** (`list_users()`): nombre, correo, rol, dependencia, estado (activo / desactivado / invitación pendiente), último ingreso. Filtros por rol, dependencia y estado; búsqueda por nombre o correo; `ui/Pagination`.
- **Crear** (modal): nombre, correo, rol, juzgado (solo si el rol es de alcance `court`). La Edge Function genera una **contraseña temporal** aleatoria (`auth.admin.createUser` con el correo ya confirmado). El formulario solo crea: al terminar vuelve a la lista, que muestra la contraseña **una sola vez** en un aviso con botón de copiar, para entregarla al usuario por un canal seguro. No se guarda en ningún lado.
- **Restablecer contraseña**: genera una nueva contraseña temporal (mismo flujo) para quien la olvidó, mientras no haya SMTP propio.
- **Editar**: nombre, rol, juzgado.
- **Desactivar / reactivar**: además de `active`, bloquea el inicio de sesión en Supabase Auth (`ban_duration`), porque marcar `active = false` no impide entrar.
- **Edge Function `manage-users`** (con verificación de JWT, a diferencia de `submit-request` y `submit-survey`):
  1. identifica a quien llama con su JWT;
  2. comprueba `usuarios.gestionar` con `has_permission`;
  3. valida los datos (zod), incluida la regla del nombre de `profile/schema.ts`;
  4. hace la operación con la service role key (`auth.admin.*`) y escribe el perfil;
  5. responde errores en español (correo ya registrado, último superadmin, etc.).
- Nadie se edita ni se desactiva a sí mismo desde esta sección (para eso está Mi perfil).

### Resultado de la fase 2 (2026-10-05)

- Migración `20261005160000_list_users.sql`: `list_users()` (exige `usuarios.ver`; incluye cuentas de Auth sin perfil, que aparecen "Sin rol" con el botón "Asignar rol").
- Edge Function `supabase/functions/manage-users/index.ts` (con verificación de JWT): acciones `create`, `update`, `set-active` y `reset-password`. Exige `usuarios.gestionar` llamando a `has_permission` con el JWT de quien llama; solo un superadmin asigna o modifica a un superadmin; nadie se gestiona a sí mismo; al crear, si falla el perfil se borra la cuenta de Auth; desactivar bloquea también el inicio de sesión (`ban_duration`); contraseña temporal de 14 caracteres (mayúsculas, minúsculas, números y un símbolo, sin 0/O/1/l/I).
- Dashboard `src/dashboard/usuarios/`: lista (tabla desde `md`, tarjetas en celular; "Último ingreso" en la tabla desde `2xl` por espacio), búsqueda sin tildes y filtros por rol, dependencia y estado (en el navegador: son 16 usuarios, sin paginación), crear / editar en un modal (juzgado solo si el rol es de alcance `court`), desactivar / reactivar y restablecer con confirmación, y el aviso con la contraseña temporal (oculta, "Mostrar", "Copiar") arriba de la lista con el usuario resaltado. `CopyButton` pasó de `contacto/` a `components/ui`.
- Probado en headless Edge con respuestas simuladas (lista, filtros, validaciones, correo repetido, crear con aviso y resaltado, desactivar).
- **Probado contra Supabase real (2026-10-05):** crear usuario e iniciar sesión, cambio obligatorio de la contraseña temporal, desactivar (ya no puede iniciar sesión).
- Lo que hacen otros usuarios en su sesión (cambiar la contraseña temporal, iniciar sesión) no llega solo a la lista: `useUsers` la vuelve a pedir al volver a la pestaña, cada minuto mientras está visible y con el botón "Actualizar".

### Fase 3: sección Roles (`/dashboard/roles`)

- Lista de roles con su alcance, número de usuarios y número de permisos.
- Crear / editar: nombre, descripción, alcance y una **matriz de permisos** agrupada por módulo (casillas; "marcar todo el módulo").
- Borrar: solo si no tiene usuarios. `superadmin` aparece bloqueado ("Tiene todos los permisos").
- Con escritura directa por RLS (`roles.gestionar`), sin Edge Function: no toca Supabase Auth.

### Resultado de la fase 3 (2026-10-05)

- Migración `20261005170000_roles_admin.sql`:
  - `list_roles()` (exige `roles.ver`): roles con número de usuarios y de permisos (security definer, porque contar usuarios exige leer perfiles ajenos).
  - `save_role(p_id, p_code, p_name, p_description, p_scope, p_permissions)`: crea o edita el rol y deja exactamente esos permisos en una sola transacción. Es `security invoker`, así que se aplican los grants por columna, las políticas (`roles.gestionar`) y los triggers de la fase 1.
  - Borrar es un `delete` directo con RLS: la llave foránea impide borrar un rol con usuarios y el trigger, el del sistema.
- Dashboard `src/dashboard/roles/`:
  - `/dashboard/roles`: tarjetas con alcance, usuarios y permisos; Borrar deshabilitado con el motivo ("Rol del sistema", "Tiene usuarios asignados").
  - `/dashboard/roles/nuevo` y `/dashboard/roles/:id`: nombre (el código sale del nombre, sin tildes, y no cambia después), descripción, alcance (bloqueado si el rol tiene usuarios) y `PermissionMatrix` por módulo, con "Todo el módulo" (marcado, desmarcado o a medias).
  - Superadmin y usuarios sin `roles.gestionar` lo ven en modo lectura.
  - Al guardar se vuelve a la lista con un aviso y el rol resaltado.
  - `ConfirmDialog` pasó a `src/dashboard/ui/` (lo usan Usuarios y Roles).
  - Los nombres de los módulos están en `roles/data.ts` (`MODULE_LABELS`): agregar ahí el módulo de cada sección nueva.
- Probado en headless Edge con respuestas simuladas y **contra Supabase real (2026-10-05)**.

### Fase 4: sección Permisos (`/dashboard/permisos`)

- Catálogo agrupado por módulo: código, nombre, descripción y roles que lo tienen.
- Editar nombre y descripción (`permisos.gestionar`).

### Menú resultante

```
Inicio
Avisos de Remate
Audiencias
PQRS
Encuestas
ADMINISTRACIÓN
  Usuarios
  Roles
  Permisos
```

## Cómo lo usarán las secciones (ejemplo: Avisos de Remate)

```sql
-- migración del plan de Avisos de Remate
insert into public.permissions (code, module, name) values
  ('remates.ver', 'remates', 'Ver avisos (incluye borradores)'),
  ('remates.editar', 'remates', 'Crear y editar avisos'),
  ('remates.publicar', 'remates', 'Publicar y despublicar');

create policy auction_notices_update on public.auction_notices
  for update to authenticated
  using (public.has_permission('remates.editar', court))
  with check (public.has_permission('remates.editar', court));
```

- Un usuario `juzgado` del Juzgado 1 con `remates.editar` edita solo avisos con `court = 1`.
- Un usuario `oficina` con `remates.ver` ve los de los dos juzgados; si no tiene `remates.editar`, no edita.
- "Editar algunas opciones, no todas" para Oficina se resuelve dando a `oficina` solo ciertos permisos del módulo. Si alguna vez hiciera falta limitar **campos** (no acciones), esa sección usará una función SQL para esa edición, como `grant update (full_name)` en Mi perfil.

## Verificación

- Pruebas SQL de `has_permission` con usuarios de cada rol y juzgado (en una migración de prueba o en SQL Editor, dentro de una transacción con `rollback`).
- Último superadmin: intentar quitarle el rol o desactivarlo debe fallar.
- Un usuario `juzgado` no puede cambiarse el rol ni el juzgado llamando a la API directamente.
- Menú y rutas: cada rol ve solo lo suyo; la dirección escrita a mano muestra "No tiene acceso".
- Usuarios: crear, editar, desactivar (y comprobar que ya no puede iniciar sesión), reactivar.
- Lint, build, claro / oscuro, 375 a 1280 px, teclado.

## Respuestas (2026-10-05)

1. **Cuentas:** las crea el `superadmin`, a partir de un listado que ya tiene, con contraseña temporal y cambio obligatorio en el primer ingreso. Las invitaciones por correo quedan para cuando haya SMTP propio.
2. **Ver Usuarios:** solo `superadmin`.
3. **Crear usuarios (y gestionar roles y permisos):** solo `superadmin`, por ahora.
4. **Dependencia:** "Oficina" como etiqueta.

## Carga del listado (decidido el 2026-10-05)

- Son **16 usuarios**: se crean **uno por uno** con el formulario de la sección Usuarios. Sin importación CSV: para 16 cuentas no compensa construir y probar la carga en lote (vista previa, errores por fila, contraseñas en lote).
- El formulario **solo crea**. Al crear, se cierra y se vuelve a la **lista de usuarios**, ya actualizada, con el nuevo usuario resaltado.
- La contraseña temporal se muestra en un aviso arriba de la lista ("Usuario creado: <nombre> · Contraseña temporal: •••• [Mostrar] [Copiar]"), que se cierra con su botón o al salir de la página. No se vuelve a mostrar: si se pierde, se usa "Restablecer contraseña".
- Si más adelante llegan muchos usuarios de una vez, la importación CSV se agrega como mejora de la sección.
