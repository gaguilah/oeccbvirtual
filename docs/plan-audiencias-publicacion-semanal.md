# Plan: publicación semanal de audiencias de remate (dashboard)

> **Histórico.** El comportamiento actual está en [modulos/audiencias.md](modulos/audiencias.md) (sección Publicación semanal). Si este plan y el módulo no coinciden, vale el módulo.

Estado: **construido** (20 de noviembre de 2026), en la rama `audiencias-publicacion-semanal`. Sin
migración. Diseño elegido: **opción A, lista por día**. La hora se muestra como en el resto del
sitio ("8:30 a. m."), y el día como "Miércoles, 11 de noviembre".

## Objetivo

Hoy, cada viernes, la oficina arma a mano un bloque HTML con las audiencias de remate de la semana
siguiente de cada juzgado y lo pega en una sección del portal que acepta código. La idea es que el
dashboard de Audiencias genere ese bloque, juzgado por juzgado y solo con las audiencias de remate,
listo para copiar y pegar.

## Decisiones

| Tema | Decisión |
|---|---|
| Entrada | Botón **"Publicación semanal"** en la fila de acciones de Audiencias, junto a [Ver estadísticas]. |
| Ruta | `/dashboard/audiencias/publicacion?juzgado=1&semana=2026-11-23`, hija de Audiencias (el Topbar dice "Audiencias"). |
| Permiso | El mismo **`audiencias.ver`**, por juzgado. No hay permiso nuevo ni migración: la página solo lee, y RLS aplica el alcance. |
| Juzgado | Selector de juzgado; un usuario de juzgado tiene el suyo fijo, como en el resto de la sección. Una publicación por juzgado. |
| Semana por defecto | **La semana siguiente** (lunes a viernes). Se publica el viernes para la semana que sigue. Con ‹ › se cambia de semana. |
| Qué audiencias entran | Juzgado elegido, tipo **Audiencia de Remate**, estado **Programada**, `scheduled_at` entre el lunes 00:00 y el viernes 23:59 (hora de Bogotá), ordenadas por fecha y hora. Canceladas y Realizadas no entran. |
| Tipo de remate | Se reconoce por la descripción `'audiencia de remate'`, la misma regla de `create_auction_notice_with_hearing()`. Va en una constante de `audiencias/` con un test `?raw` que compruebe que la migración usa el mismo texto. |
| Audiencia sin enlace | **No se publica sin enlace.** Si alguna audiencia de la semana no tiene `connection_url`, la página la lista en una alerta ("Falta el enlace de conexión") con acceso para editarla, y "Copiar HTML" / "Descargar .html" quedan deshabilitados con el motivo hasta que todas lo tengan. |
| Otras advertencias | No bloquean: "Aviso de remate eliminado" (`auction_notice_deleted`). |
| Semana sin audiencias | Se genera igual, con el texto "No hay audiencias de remate programadas para esta semana". |
| Salida | El HTML como texto: "Copiar HTML" (`CopyButton`) y "Descargar .html". |
| Registro | **No hay registro** de publicaciones (quién o cuándo): solo se genera el código. Nada se guarda en la base. |
| Vista previa | Componentes React que imitan el formato, **no** un iframe: la CSP (`style-src 'self'`) bloquearía el `<style>` de un `srcdoc`, y `noRawHtml.test.ts` prohíbe `dangerouslySetInnerHTML`. El texto copiado sale siempre de la función pura. |
| Cambios después del viernes | Si una audiencia de la semana cambia después de publicar, se vuelve a generar y se **vuelve a publicar** el bloque en el portal. Los avisos de cambio por correo siguen como hoy. |

## Formato de la publicación (opción A: lista por día)

El HTML del ejemplo es el que la oficina venía pegando en el portal sin problemas: un solo bloque
con su `<style>`, sin JavaScript ni fuentes externas. El nuevo formato sigue esas mismas reglas y
cambia la presentación. Se eligió entre dos maquetas con los datos del ejemplo (la otra era la tabla
actual mejorada).

### Estructura

1. **Encabezado** (franja azul claro):
   - Etiqueta "AUDIENCIAS DE REMATE".
   - Nombre oficial del juzgado (desde `src/lib/courts.ts`): "Juzgado 1 Civil del Circuito de
     Ejecución de Sentencias de Bucaramanga".
   - "Semana del 23 al 27 de noviembre de 2026".
   - "Publicado el 20/11/2026": **solo la fecha, sin hora**. Como se republica cuando algo cambia,
     indica cuál es la versión vigente.
2. **Un subtítulo por día** ("Miércoles 11 de noviembre"); solo los días con audiencias. Debajo,
   una fila por audiencia:
   - **Hora** destacada ("08:30 a. m.").
   - **Radicado** en fuente de ancho fijo, sin cortes (`white-space: nowrap`), con la etiqueta
     "Radicado".
   - Botón principal **"Ingresar a Teams"** (`connection_url`).
   - Botón secundario **"Ver aviso"**: `https://oeccbvirtual.app/avisos-remates?juzgado=<n>&q=<radicado>`
     (página pública filtrada, que sigue sirviendo aunque cambie la URL del PDF).
   - Semana vacía: un único mensaje, "No hay audiencias de remate programadas para esta semana".
3. **Pie** con dos enlaces filtrados por el juzgado: "Todos los avisos de remate"
   (`/avisos-remates?juzgado=<n>`) y "Consultar audiencias" (`/audiencias?juzgado=<n>`).

### Estilo

- Colores del sitio: azul `#193cb8` en etiqueta, días y botón principal; fondos `#f8fafc` /
  `#eaf1ff` / blanco para separar zonas; botón secundario `#dbeafe` con texto azul. Sin bordes en
  cada celda. Contraste WCAG AA.
- Fuente del sistema (Arial / Helvetica; Consolas para el radicado): el portal no carga fuentes
  del sitio.
- **Clases con prefijo propio** (`oeccb-pa`, `oeccb-pa__item`, …), para no chocar con los estilos
  del portal (Bootstrap define `.container`).
- **CSS plano**, sin anidar.
- **Adaptable al ancho de la sección**, no de la pantalla: el bloque es `container-type:
  inline-size` y con `@container (max-width: 560px)` cada audiencia pasa a tarjeta (hora,
  radicado y botones apilados, botones a todo el ancho) y el pie a una columna.
- Lista semántica (`<ul>` por día, `<h3>` del juzgado, `<h4>` por día).
- Todos los enlaces con `target="_blank" rel="noopener noreferrer"` y texto oculto accesible
  (", radicado … (se abre en una pestaña nueva)").
- Foco de teclado visible; sin animaciones de `transform`.
- Escape de todos los valores (radicado, URL: `&` → `&amp;`, comillas).

## Código previsto

- `src/dashboard/audiencias/publicacion/data.ts` (puro, sin Supabase):
  - `defaultPublicationWeek(now)`: lunes de la semana siguiente, en Bogotá.
  - `selectWeeklyAuctionHearings(hearings, court, weekStart)`: filtro y orden.
  - `groupByDay(hearings)`: días con sus audiencias, en orden.
  - `missingLinks(hearings)`: las que bloquean la copia.
  - `noticeUrl(court, caseNumber)`, `weekLabel(weekStart)`, `dayLabel(day)`.
  - `weeklyPublicationHtml({ court, weekStart, publishedOn, hearings })`: el texto HTML.
- `publicacion/PublicationPage.tsx` (filtros, alertas, vista previa, botones) y su ruta en `routes.tsx`.
- Reutiliza `audiencias/dates.ts` (semanas), `lib/courts.ts`, `timeLabel` y `CopyButton`.
- Consulta: la misma de la tabla de Audiencias, con filtros de juzgado, tipo, estado y rango de fechas.

## Pruebas (Vitest)

- Semana por defecto: viernes, sábado, domingo y lunes con `vi.setSystemTime()` (fechas con `-05:00`).
- Filtro: tipo, estado, juzgado y límites de la semana (viernes 23:59 dentro, sábado fuera).
- Orden y agrupación por día; días sin audiencias omitidos; semana vacía.
- Falta de enlace: `missingLinks` y bloqueo.
- "Publicado el" sin hora; URL de "Ver aviso" con el radicado codificado.
- Escape con los payloads de `lib/testInjection.ts`; `rel="noopener noreferrer"` en cada enlace.
- Fecha y hora comparadas tras normalizar espacios (Intl).
- Test `?raw` de la descripción del tipo de remate contra la migración.

## Documentación (mismo commit)

- `docs/modulos/audiencias.md`: nueva sección "Publicación semanal".
- `src/dashboard/ayuda/data.ts`: guía de Audiencias, pasos del viernes.
- Este plan pasa a "Histórico" cuando se construya.

## Fase 2 (opcional)

- El correo semanal de `hearings-mailer` o un recordatorio del viernes con el enlace a la página
  ya filtrada por juzgado y semana.
