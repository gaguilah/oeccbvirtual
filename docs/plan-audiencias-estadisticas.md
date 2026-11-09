# Plan: estadísticas de audiencias (dashboard)

> **Histórico.** El comportamiento actual está en [modulos/audiencias.md](modulos/audiencias.md) (sección Estadísticas). Si este plan y el módulo no coinciden, vale el módulo.

Estado: **construido** (5 de noviembre de 2026), en la rama `audiencias-estadisticas`. La migración
`20261105120000_hearing_stats.sql` se aplicó en producción (SQL Editor) y se registró el 5 de noviembre de 2026.
Pruebas manuales hechas el 9 de noviembre de 2026.

## Objetivo

Una vista privada, `/dashboard/audiencias/estadisticas`, con indicadores y un gráfico de las
audiencias del periodo por estado: Programadas (pendientes), Realizadas y Canceladas. Se filtra
por juzgado, periodo (mes, rango de meses o año), tipo de audiencia y modalidad (virtual o
presencial).

## Decisiones

| Tema | Decisión |
|---|---|
| Entrada | Botón **"Ver estadísticas"** en la fila de acciones de Audiencias, junto a [Tipos de audiencia] [Programar audiencia]. |
| Ruta | `/dashboard/audiencias/estadisticas`, hija de Audiencias (el Topbar dice "Audiencias", el menú la deja marcada). |
| Permiso | El mismo **`audiencias.ver`**, por juzgado. No hay permiso nuevo. Quien ve audiencias ve sus estadísticas, con el mismo alcance. |
| Qué es "Programada" | Las que **siguen** en estado Programada (futuras o por cerrar). Los tres estados suman el total: 12 + 3 + 5 = 20. |
| Por cerrar | Dentro de Programadas, la tarjeta dice "de ellas, N por cerrar": las Programadas cuya hora ya llegó, la misma regla de la pestaña Por cerrar (`scheduled_at <= now()`, reloj del servidor). |
| Fecha que cuenta | La fecha de realización, `scheduled_at`, en hora de Colombia: una audiencia cuenta en el mes en que estaba o está programada, no en el de su creación. |
| Tarjetas | Total del filtro, y para Realizadas, Canceladas y Programadas su número y su **% del total del filtro**; Programadas añade "de ellas, N por cerrar". Con total 0 se ve "—", no 0 %. |
| Gráfico | Uno solo: **por tipo de audiencia**, barras horizontales **apiladas** por estado (Realizadas, Canceladas, Programadas), ordenadas de más a menos audiencias, con "Ver como tabla". |
| Sin tendencia mensual | No se agrega, ni con un rango de varios meses o un año. |
| Filtro juzgado | Quien tiene alcance `all` elige Ambos, Juzgado 1 o Juzgado 2. Un usuario de juzgado lo ve fijo en el suyo, como en las demás páginas. |
| Filtro periodo | El mismo de Encuestas: mes, rango de meses (hasta 24) o año. Por defecto, el mes actual. |
| Filtro tipo | Uno o "Todos los tipos". Incluye los tipos inactivos, porque pueden tener audiencias en el periodo. |
| Modalidad | Filtro **Todas / Virtual (Microsoft Teams) / Presencial**. Sale del **tipo** de la audiencia (`hearing_types.requires_link`), igual que "Modalidad" en el sitio público: no se guarda por audiencia ni se migran datos. Si un tipo cambia su marca, sus audiencias pasadas cambian de modalidad en las estadísticas (se dice en Ayuda). Al elegir una modalidad, la lista de tipos muestra solo los de esa modalidad. |
| URL | Todos los filtros van en la URL (`juzgado`, `periodo`…, `tipo`, `modalidad`). Se pueden compartir y Atrás los restaura. |
| Fuera de alcance | CSV, comparación con el periodo anterior, comparativo de juzgados, mapa de calor día × hora, indicadores de expediente. Quedan como ideas para después. |

## Base de datos

Migración nueva `2026110xxxxxxx_hearing_stats.sql`:

- Función `public.hearing_stats(p_from date, p_to date, p_court smallint default null, p_type smallint default null, p_virtual boolean default null)`
  que devuelve `jsonb`: `{ rows: [{ type_id, description, requires_link, total, realizadas, canceladas,
  programadas, por_cerrar }], first_year, last_year }`. `p_virtual` filtra por
  `hearing_types.requires_link` (null = todas). `por_cerrar` son las Programadas con
  `scheduled_at <= now()`. `first_year` / `last_year` arman la lista de años. Las tarjetas se suman
  en el navegador.
- Es **`security invoker`** con `search_path = ''`: cuenta sobre `hearings` con el RLS de quien la
  llama, así un usuario de juzgado solo suma el suyo aunque envíe otro `p_court`. Si no tiene
  `audiencias.ver`, devuelve `forbidden`. Valida el periodo (`invalid_period`), igual que
  `survey_stats`.
- `revoke execute … from public, anon` y `grant execute … to authenticated`.
- No crea tablas ni permisos.
- Índice: `hearings_court_scheduled_at_idx` ya existe y alcanza.

## Navegador

- **Compartir el periodo con Encuestas:** mover `period.ts` (más su test), `usePeriodFilters` y
  `PeriodFilters` de `encuestas/` a una carpeta común del dashboard (`src/dashboard/period/`).
  Encuestas los importa desde ahí. `usePeriodFilters` debe **conservar** los demás parámetros de la
  URL: hoy `serializePeriod` los reemplaza todos y borraría `juzgado` y `tipo`.
- **Gráficos compartidos:** mover `encuestas/charts/` a `src/dashboard/charts/` y agregar
  `StackedBarChart`: barras horizontales apiladas, leyenda, colores de estado (verde Realizadas,
  gris `outline-variant` Canceladas, `primary` Próximas, ámbar Por cerrar: los mismos de
  `HearingBadges`; Cancelada es gris allí porque no es un error), "Ver como tabla"
  accesible y conteo + % en el texto de cada barra, porque el color solo no basta.
- `src/dashboard/audiencias/estadisticas/`:
  - `HearingStatsPage.tsx`: la página, con `useDocumentMeta({ title: 'Estadísticas de audiencias · Dashboard', noindex: true })`
    y la miga "Audiencias › Estadísticas".
  - `filters.ts`: la lectura y escritura pura de `juzgado`, `tipo` y `modalidad`, con su test.
  - `stats.ts`: totales y porcentajes desde `rows` (división por 0 = "—"), con su test.
  - `api.ts` / `useHearingStats.ts`: llamada a `hearing_stats`, que cancela la petición anterior.
- `routes.tsx`: ruta `audiencias/estadisticas` bajo `RequirePermission('audiencias.ver')`.
- Estados de la página: cargando (esqueleto), sin audiencias en el filtro (`EmptyState`) y error
  con "Reintentar".
- Los filtros **no** quedan fijos bajo el Topbar: la página no es una lista y el bloque (filtros +
  periodo) es alto; fijo taparía las tarjetas.
- Las barras se parten en cuatro: Realizadas, Canceladas, **Próximas** (Programadas cuya hora no
  llegó) y **Por cerrar**, con los nombres de las pestañas de Audiencias.

## Pruebas

- **pgTAP** (`supabase/tests/`): `hearing_stats` cuenta por estado y por tipo dentro del periodo
  (bordes del mes en hora de Bogotá); el filtro de modalidad según el tipo; `por_cerrar` cuenta solo Programadas cuya hora llegó; un usuario de juzgado no ve el otro juzgado aunque lo pida;
  sin `audiencias.ver`, devuelve `forbidden`; periodo inválido. Además, actualizar `01_esquema.sql`:
  EXECUTE de la función nueva.
- **Vitest:** `stats.ts` (porcentajes, total 0), `filters.ts` (valores inválidos en la URL, juzgado
  forzado, modalidad), `usePeriodFilters` sin borrar otros parámetros, y que los tests de `period.ts` sigan
  pasando tras moverlo.

## Documentación

En el mismo commit:

- `docs/modulos/audiencias.md`: sección "Estadísticas", que dice qué cuenta en cada estado, "por
  cerrar", la fecha que cuenta, de dónde sale la modalidad y el permiso.
- `src/dashboard/ayuda/data.ts`: en la guía de Audiencias, cómo leer las estadísticas, y en sus
  `paths` la ruta nueva.
- CLAUDE.md: una línea en Audiencias del dashboard y la carpeta compartida de periodo y gráficos.

## Orden

1. Migración + pgTAP, en una rama, en GitHub Actions. Después se aplica en el SQL Editor.
2. Mover periodo y gráficos a carpetas comunes (Encuestas sigue igual) + `StackedBarChart`.
3. Página, ruta y botón.
4. Documentación y Ayuda.
5. PR, Deploy Preview y merge a `main`.
