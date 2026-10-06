# Plan: gestión de Avisos de Remate en el dashboard (construido el 2026-10-05)

Primera sección con datos del dashboard. Hoy los avisos se cargan desde el Table Editor de Supabase (`docs/plan-remates.md`); con esta sección se crean, editan, publican y ocultan desde `/dashboard/avisos-remates`, cada juzgado los suyos. La tabla es la misma del sitio público (`components/remates/`), con columnas y acciones de administración. Rama: `avisos-remate`, desde `main`.

## Punto de partida

- `auction_notices`: `case_number` (23 dígitos), `court` (1 | 2), `scheduled_at`, `pdf_url`, `is_published` (por defecto `true`), `created_at`, `updated_at`. Único por `(case_number, scheduled_at)`.
- El trigger `auction_notices_before_write` arma `pdf_url` con la carpeta de `pdf_folders` vigente en el `created_at`. Es `security invoker`: **quien escriba avisos debe poder leer `pdf_folders`**.
- RLS: solo lectura pública de `is_published = true`; sin políticas de escritura. `pdf_folders` sin políticas.
- Sitio público: `RematesTable` (escritorio: tabla; celular: tarjetas), `RemateStatusBadge` (Agendado / Realizado, 60 min después de la hora), filtros en la URL (`useRematesFilters`), paginación en el servidor de 10 en 10, `RemateDetailModal`, fechas en `America/Bogota` (`remates/dates.ts`).
- Permisos: `has_permission('<código>', court)` y los roles `juzgado` (alcance un juzgado) y `oficina` (ambos) de `docs/plan-usuarios.md`.

## Permisos nuevos (módulo `remates`)

| Código | Nombre | Qué permite | Por juzgado |
| --- | --- | --- | --- |
| `remates.ver` | Ver avisos | Ver la sección y todos los avisos, también los ocultos | Sí |
| `remates.crear` | Crear avisos | Crear avisos (ocultos, salvo que también pueda publicar) | Sí |
| `remates.editar` | Editar avisos | Cambiar radicado, juzgado, fecha y hora, y corregir la URL del PDF | Sí |
| `remates.publicar` | Publicar avisos | Publicar u ocultar un aviso en el sitio público | Sí |
| `remates.eliminar` | Eliminar avisos | Borrar un aviso definitivamente | Sí |
| `remates.carpetas` | Carpetas de publicación | Ver y agregar carpetas de `pdf_folders` (cambian pocas veces) | No (es una configuración común) |

"Por juzgado" significa que un usuario `juzgado` solo puede hacerlo sobre los avisos de **su** juzgado (`court = profiles.court`). Un usuario de alcance "ambos juzgados" lo hace sobre los dos.

Asignación inicial (decidida el 2026-10-05; el superadmin la cambia cuando quiera en Roles):

| Rol | Permisos |
| --- | --- |
| `juzgado` | `remates.ver`, `crear`, `editar`, `publicar`, `eliminar` (el CRUD de su juzgado) |
| `oficina` | `remates.ver` (ve los dos juzgados; lo que pueda editar se decide después) |
| `superadmin` | Todos, incluido `remates.carpetas` |

## Base de datos (una migración)

### Columnas de auditoría

- Sencilla: `created_by uuid` y `updated_by uuid` (referencias a `auth.users`, `on delete set null`). Las llena el trigger con `auth.uid()`; desde el SQL Editor quedan en null.
- El detalle del aviso muestra una línea: "Creado por <nombre> el <fecha> · Editado por <nombre> el <fecha>" (sin historial de cambios). Los nombres se leen con una función que devuelve solo el nombre de esos dos usuarios.

### Políticas en `auction_notices`

```sql
-- Se suma (OR) a la política pública de los publicados.
create policy auction_notices_select_admin on public.auction_notices
  for select to authenticated using (public.has_permission('remates.ver', court));

create policy auction_notices_insert on public.auction_notices
  for insert to authenticated with check (public.has_permission('remates.crear', court));

-- using: la fila actual es de su juzgado; with check: la fila nueva también
-- (un usuario del Juzgado 1 no puede pasar un aviso al Juzgado 2).
create policy auction_notices_update on public.auction_notices
  for update to authenticated
  using (public.has_permission('remates.editar', court) or public.has_permission('remates.publicar', court))
  with check (public.has_permission('remates.editar', court) or public.has_permission('remates.publicar', court));

create policy auction_notices_delete on public.auction_notices
  for delete to authenticated using (public.has_permission('remates.eliminar', court));
```

### Reglas que RLS no puede expresar (trigger nuevo `auction_notices_check_permissions`)

RLS decide por fila, no por columna. Un trigger `before insert or update` completa la regla:

- **Publicar es un permiso aparte:** cambiar `is_published` exige `remates.publicar`. Quien solo tiene `remates.editar` no puede publicar ni ocultar.
- **Editar los datos es un permiso aparte:** cambiar `case_number`, `court`, `scheduled_at` o `pdf_url` exige `remates.editar`. Quien solo tiene `remates.publicar` solo puede publicar u ocultar.
- **Al crear:** quien tiene `remates.publicar` crea el aviso **publicado** (como hoy en el Table Editor), salvo que desmarque "Publicado"; sin `remates.publicar`, nace oculto (`is_published = false`) aunque se envíe `true`.
- Llena `created_by` / `updated_by`.
- Solo actúa cuando hay un usuario (`auth.uid()` no nulo). El SQL Editor y el Table Editor (rol `postgres`) siguen funcionando como hoy.

### `pdf_folders`

- Lectura: `remates.crear`, `remates.editar` o `remates.carpetas` (el trigger de la URL la necesita al escribir avisos, y el formulario la usa para la vista previa).
- Agregar: `remates.carpetas`. Las carpetas no se editan (regla de `docs/plan-remates.md`: cuando cambia la carpeta se agrega una fila nueva). Borrar: solo una carpeta con `valid_from` futura, que todavía no usa ningún aviso.

### Grants

- `auction_notices`: `insert`, `update`, `delete` para `authenticated` (las políticas y el trigger deciden).
- `pdf_folders`: `select`, `insert`, `delete` para `authenticated`.
- Se mantiene la lectura pública de los publicados para `anon`.

### Datos

- Los 6 permisos de la tabla, y su asignación a `juzgado` y `oficina` según la tabla de arriba (si se confirma).

## Dashboard (`src/dashboard/remates/`)

### Lista (`/dashboard/avisos-remates`)

Misma tabla que el sitio público, sobre la misma base:

```
[Próximos] [Pasados] [Todos]        Juzgado: [Todos ▾]   Publicación: [Todos ▾]   Radicado: [______]
┌────────────────┬─────────────────────────┬───────────┬──────────┬────────────┬──────────────────┐
│ Fecha y hora   │ Radicado                │ Juzgado   │ Estado   │ Publicación│                  │
├────────────────┼─────────────────────────┼───────────┼──────────┼────────────┼──────────────────┤
│ 12 nov 2026    │ 68001310300120200012300 │ Juzgado 1 │ Agendado │ Publicado  │ Ver · Editar · ⋯ │
│ 9:00 a. m.     │                         │           │          │            │                  │
│ 14 nov 2026    │ 68001310300220210004500 │ Juzgado 2 │ Agendado │ Oculto     │ Ver · Editar · ⋯ │
└────────────────┴─────────────────────────┴───────────┴──────────┴────────────┴──────────────────┘
Mostrando 1–10 de 37 avisos                                                   ‹ 1 2 3 4 ›
```

- **Columnas del sitio público** (fecha y hora, radicado, juzgado, estado Agendado / Realizado) con los mismos estilos, formato de fechas y `RemateStatusBadge`, más **Publicación** (Publicado / Oculto) y **acciones**.
- **Filtros en la URL**, como el público: periodo (Próximos, Pasados y además **Todos**), juzgado, publicación (Todos, Publicados, Ocultos) y radicado. Un usuario `juzgado` no ve el filtro de juzgado: solo ve el suyo.
- **Paginación en el servidor**, de 10 en 10, con `ui/Pagination`, igual que el público.
- **Acciones por aviso** (cada una solo con su permiso y para su juzgado):
  - **Ver**: detalle (datos, URL del PDF con "Ver aviso" / "Descargar PDF", y la auditoría).
  - **Editar** (`remates.editar`).
  - **Publicar / Ocultar** (`remates.publicar`), con confirmación al ocultar.
  - **Eliminar** (`remates.eliminar`): borrado definitivo, con confirmación (`ConfirmDialog`) que muestra el radicado, la fecha y si está publicado, y advierte que no se puede deshacer.
- **Crear aviso** (`remates.crear`) arriba de la tabla.
- Al crear o editar, se vuelve a la lista con un aviso y la fila resaltada (como Usuarios y Roles).

### Reutilización del sitio público

- Se reutilizan tal cual: `COURTS`, `dates.ts` (formato y corte Agendado / Realizado), `RemateStatusBadge`, `pdfDownloadUrl`, `ui/Pagination`, `CASE_NUMBER_LENGTH`.
- `RematesTable` hoy trae el botón "Ver aviso" fijo. Se separan sus piezas comunes (estilos de celdas y la celda de fecha) en `remates/tableParts.tsx`, que usan la tabla pública y la del dashboard (`AdminRematesTable`). La tabla pública no cambia de aspecto.
- `useRematesFilters` se generaliza para aceptar los filtros extra del dashboard (periodo "Todos" y publicación), sin cambiar la URL pública.
- `fetchAuctionNotices` recibe las columnas y filtros extra. En el dashboard, RLS devuelve también los ocultos a quien tenga `remates.ver`.

### Formulario (modal, crear y editar)

| Campo | Detalle |
| --- | --- |
| Radicado | 23 dígitos (zod). Se aceptan espacios o guiones al pegar y se quitan. Ayuda: "Número de radicación del proceso, 23 dígitos" |
| Juzgado | Selector. Un usuario `juzgado` lo ve fijo en el suyo |
| Fecha y hora | Fecha y hora en hora de Colombia (sin cambio de horario: `-05:00`). Se permiten fechas pasadas (para cargar avisos antiguos) |
| Publicado | Casilla, solo con `remates.publicar`, **marcada por defecto**. Sin ese permiso, el aviso queda oculto y se explica por qué |
| URL del PDF | Vista previa calculada con la misma fórmula del trigger y la carpeta vigente, con "Abrir" para comprobar que el PDF ya está en el portal. Al editar, opción "Corregir la URL manualmente" (el trigger respeta una URL corregida) |

Errores en español: radicado y hora repetidos (llave única), sin carpeta vigente (`no_pdf_folder`), sin permiso.

### Carpetas de publicación (`/dashboard/avisos-remates/carpetas`, `remates.carpetas`)

- Lista de `pdf_folders` (desde qué fecha, `group_id`, `folder_id`), con la vigente marcada.
- "Agregar carpeta": `group_id`, `folder_id` y "Vigente desde". Borrar solo las futuras.
- Ayuda corta: de dónde salen los números (las dos secciones de la URL del portal) y que los avisos ya creados conservan su URL.

### Menú e Inicio

- "Avisos de Remate" pasa a `ready: true`, con `permission: 'remates.ver'`.
- `MODULE_LABELS` ya tiene `remates: 'Avisos de Remate'`.

## Verificación

- SQL (en una transacción con `rollback`): un usuario `juzgado` del Juzgado 1 no puede leer ocultos, crear, editar, publicar ni borrar avisos del Juzgado 2, ni pasar un aviso al Juzgado 2; sin `remates.publicar` un aviso nuevo queda oculto; con solo `remates.publicar` no puede cambiar el radicado.
- El sitio público sigue mostrando solo los publicados y se ve igual.
- Dashboard: cada acción aparece solo con su permiso; filtros, paginación, crear, editar, publicar, ocultar, eliminar, carpetas; claro y oscuro; 375 a 1536 px; teclado.
- Lint, build, `CLAUDE.md`.

## Resultado (2026-10-05)

- Rama `avisos-remate`. Migración `supabase/migrations/20261005180000_auction_notices_admin.sql`: columnas `created_by` / `updated_by`, trigger `auction_notices_authorize` (corre antes que el de la URL por orden alfabético), políticas de `auction_notices` y `pdf_folders`, grants por columna, `auction_notice_audit(p_id)`, los 6 permisos y su asignación a `juzgado` y `oficina`. Aplicada.
- Sitio público: la tabla se separó en piezas compartidas sin cambiar su aspecto: `components/remates/tableStyles.ts` (`headerCell`, `bodyCell`, `bodyRow`, `mobileItem`) y `NoticeCells.tsx` (`ScheduleCell`, `CaseNumberCell`, `CourtCell`, `MobileSchedule`, `MobileCaseNumber`).
- Dashboard `src/dashboard/remates/`:
  - `RematesAdminPage` y `AdminRematesTable`: tabla desde `xl` (con el menú lateral no caben las columnas antes) y tarjetas por debajo. Estado y publicación van juntos en la columna Estado. Las acciones son botones de ícono con leyenda en la tabla y botones con texto en las tarjetas.
  - Filtros en la URL con su propio hook, `useAdminFilters`: se descartó generalizar el del sitio público para no tocarlo. Usa los mismos nombres de parámetros, más `publicacion` y `periodo=todos`.
  - `NoticeFormModal`: vista previa de la URL con `pdfUrl.ts`, que repite la fórmula del trigger, y fechas en hora de Colombia con `datetime.ts`.
  - También `NoticeDetailModal` (con la auditoría) y `FoldersPage`.
- Ajustes de presentación (2026-10-06, a pedido):
  - En el dashboard no se muestra Agendado / Realizado: eso es para el público. El estado es solo **Publicado / Oculto** (`remates/PublicationBadge`), en la tabla, en las tarjetas y en el detalle. Las pestañas Próximos / Pasados / Todos siguen, porque son un filtro por fecha.
  - Las acciones van en un menú de tres puntos (`dashboard/ui/ActionMenu`, mismo panel que el selector de tema), en la tabla y en las tarjetas.
  - La tarjeta de la lista no recorta (`overflow-visible`), para que el menú de las últimas filas no quede cortado; el encabezado de la tabla y el pie llevan sus propias esquinas redondeadas.
  - El buscador dice "Busca por radicado".
- Probado en headless Edge con respuestas simuladas: superadmin (lista, filtro, validación, radicado pegado con guiones, vista previa, duplicado, crear publicado, editar, ocultar con confirmación, eliminar con confirmación, detalle con auditoría, carpetas), juzgado 1 sin publicar ni eliminar (sin selector de juzgado ni Carpetas, solo Ver y Editar, juzgado fijo, "Se creará oculto", Carpetas sin acceso), celular y la tabla pública. Probado también **contra Supabase real (2026-10-06)**.

## Respuestas (2026-10-05)

1. **Permisos iniciales:** la migración asigna `juzgado` = ver, crear, editar, publicar y eliminar (de su juzgado) y `oficina` = ver. El superadmin los ajusta después en Roles.
2. **Eliminar:** borrado definitivo, con confirmación.
3. **Avisos nuevos:** quien puede publicar los crea publicados (casilla marcada por defecto).
4. **Auditoría:** sí, sencilla: quién creó y quién editó por última vez, y cuándo.
