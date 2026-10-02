# Plan: Avisos de Remate

Migración del proyecto `avisos26Mod` (HTML + `data.json` editado a mano) a la sección `/avisos-remates` del sitio (`/remates` redirige ahí), con los datos en Supabase.

Se hace en dos etapas:

1. **Backend:** tablas, trigger, RLS y carga inicial. La administración (formulario para crear y editar avisos) llegará después, en la parte privada.
2. **Frontend:** solo el listado público.

## Hechos verificados

- `data.json` tenía 96 avisos (enero a noviembre de 2026): 23 del Juzgado 1 y 73 del Juzgado 2.
- Un mismo radicado puede aparecer varias veces. Cada aparición es un remate independiente.
- La URL del PDF sigue este patrón:
  `https://publicacionesprocesales.ramajudicial.gov.co/documents/<group_id>/<folder_id>/<radicado>-<AAAAMMDD><HH>-J0<juzgado>ECC.pdf`
- `HH` es la hora en **formato de 12 horas** con dos dígitos. Se comprobó contra el sitio: el aviso del 17/02/2026 a las 2:30 P.M. existe como `...-2026021702-J01ECC.pdf`, y la variante con `14` da 404.

## Decisiones

| Tema | Decisión |
| --- | --- |
| Radicado | Exactamente 23 dígitos (`^[0-9]{23}$`) |
| Juzgado | `smallint`, `1` o `2`. El nombre completo lo pone el frontend |
| Fecha y hora | Un solo campo `scheduled_at timestamptz`, en hora de Colombia (`America/Bogota`) |
| URL del PDF | Se guarda en cada aviso (`pdf_url`). La genera un trigger |
| Carpeta de la URL | Tabla `pdf_folders` con `group_id`, `folder_id` y `valid_from`. Se elige según el **`created_at`** del aviso (la fecha de publicación) |
| Estado | Solo **Agendado / Realizado**. No se guarda: lo calcula el frontend |
| Regla de estado | Pasa a Realizado **1 hora después** de `scheduled_at` (constante de 60 min) |
| Paginación | De a 10, en el servidor. El componente `Pagination` va en `components/ui/` para reutilizarlo |

## Etapa 1: Backend

Migración: `supabase/migrations/20261002120000_create_auction_notices.sql`.

### `pdf_folders`
- **Columnas:** `group_id` y `folder_id` son las dos secciones de números de la URL, y `valid_from` (única) indica desde qué fecha de publicación aplican.
- **Cambio de carpeta:** se agrega una fila nueva; las anteriores no se editan.
- **Seguridad:** RLS activado y sin políticas. El público no la lee.

### `auction_notices`
- **Columnas:** `case_number`, `court`, `scheduled_at`, `pdf_url`, `is_published`, `created_at`, `updated_at`.
- **Unicidad:** `unique (case_number, scheduled_at)`: el mismo radicado se permite en varias fechas, pero no dos veces en la misma.
- **Índices:** `(scheduled_at)` y `(court, scheduled_at)`.
- **Seguridad:** RLS con lectura pública solo de `is_published = true`. Sin políticas de escritura.

### Trigger `auction_notices_before_write`
- **Al insertar:** si `pdf_url` viene vacía, la genera con la carpeta vigente en la fecha de `created_at`.
- **Al actualizar:**
  - si cambia el radicado, el juzgado o la fecha del remate (o se vacía `pdf_url`), regenera la URL con la carpeta del `created_at` **original**;
  - si no, respeta una `pdf_url` corregida a mano.
- **`created_at`:** no se puede modificar en una actualización; `updated_at` se actualiza solo.
- **Sin carpeta vigente:** si no hay ninguna para la fecha, el insert falla con un mensaje claro.
- **`security invoker`**, con `search_path` vacío, como `submit_survey_response`. Hoy solo escriben el panel de Supabase y el SQL Editor (rol `postgres`), que pueden leer `pdf_folders`. La parte privada deberá dar a los administradores permiso de lectura sobre `pdf_folders`.

### Carga inicial (hecha el 2026-10-02)
SQL en `supabase/data/auction_notices_2026.sql`. Se cargaron los 96 avisos y sus URL coinciden con las de `render.js`. Al revisarlas contra el sitio, una daba 404 (radicado `68001310300320200002001`, 29/04/2026) y se corrigió a mano en `pdf_url`.

1. **Carpeta inicial:** insertar en `pdf_folders` la carpeta actual: `6098902` / `210268129`, `valid_from = 2026-01-01`.
2. **Script de conversión:** genera el SQL de los 96 avisos desde `data.json`.
3. **Verificación:** comparar las 96 URL generadas con las de `render.js` y probar algunas contra el sitio.
4. **Ejecución:** en el SQL Editor (`db push` no conecta desde la red de la oficina).

Mientras no exista la parte privada, los avisos nuevos se agregan desde el Table Editor de Supabase con radicado, juzgado y fecha/hora. La URL se genera sola.

### Parte privada (futuro)
- `/dashboard/remates`: listado y formulario (crear, editar, ocultar), con vista previa de la URL. Validación con zod: radicado de 23 dígitos.
- Pantalla para administrar `pdf_folders`.
- Rol de administrador, y políticas RLS de escritura en `auction_notices` y de lectura y escritura en `pdf_folders`.

## Etapa 2: Frontend (listado, hecho el 2026-10-02)

### Comportamiento
- **Filtro de juzgado:** Todos / Juzgado 1 / Juzgado 2.
- **Pestañas y estado** (misma regla, con margen de 60 min):
  - **Próximos:** `scheduled_at > ahora − 60 min`, ordenados del más cercano al más lejano, con estado **Agendado**.
  - **Pasados:** `scheduled_at <= ahora − 60 min`, del más reciente al más antiguo, con estado **Realizado**.
- **Búsqueda por radicado:** parcial; el campo solo acepta dígitos (máximo 23, `inputMode="numeric"`) y espera 300 ms después de escribir antes de buscar.
- **Paginación:** de a 10 en el servidor (`.range()` + `count: 'exact'`), con "Mostrando 1–10 de N remates".
- **Filtros en la URL:** `/avisos-remates?juzgado=1&periodo=pasados&q=6800&pagina=2`.

### Archivos
**En `src/components/remates/`:**
- `types.ts`, `constants.ts` (`PAGE_SIZE`, juzgados, zona horaria, margen de 60 min) y `dates.ts`.
- `api.ts`, `useAuctionNotices.ts` (carga, error, reintento, ignora respuestas fuera de orden) y `useRematesFilters.ts` (filtros en la URL).
- `RematesFilters.tsx`, `RematesTable.tsx` (tabla en escritorio y tarjetas en celular), `RemateStatusBadge.tsx` e `index.ts`.

**En `src/components/ui/`:** `Pagination.tsx`.

**Página:** `pages/Remates.tsx`.

### Buenas prácticas
- **Tabla accesible:** con `<caption>` y `scope`.
- **Enlace al PDF:** con texto para lectores de pantalla.
- **Filtros:** `aria-pressed`, y el total de resultados se anuncia cuando cambia.
- **Estados de la lista:** spinner al cargar, `Alert` con "Reintentar" si falla y `EmptyState` si no hay resultados.
- **Íconos y colores:** íconos SVG y solo colores de los tokens del diseño.
