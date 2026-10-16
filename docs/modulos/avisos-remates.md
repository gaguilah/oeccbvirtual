# Avisos de Remate

Documento vivo: describe cómo funciona **hoy** la sección. Si un cambio modifica una regla, este archivo
se actualiza en el mismo commit. La historia de cada decisión está en los planes enlazados al final.

## Qué es

Publicación de los avisos de remate de los Juzgados 1 y 2. Cada aviso es un radicado con fecha y hora
y un enlace al PDF que el juzgado sube al portal de publicaciones procesales de la Rama Judicial. El
sitio no guarda el PDF: arma su URL.

| Dónde | Ruta | Quién |
|---|---|---|
| Sitio público | `/avisos-remates` (`/remates` redirige) | Cualquiera; solo avisos publicados |
| Dashboard | `/dashboard/avisos-remates` | `remates.ver` en el juzgado |
| Carpetas de publicación | `/dashboard/avisos-remates/carpetas` | `remates.carpetas` |

## Valores clave

| Valor | Cifra | Dónde vive (cambiar juntos) |
|---|---|---|
| Pasa a Pasados / Realizado | 60 min después de la hora | `REALIZADO_DESPUES_DE_MIN` en `components/remates/constants.ts` · `list_public_hearings` (Audiencias usa el mismo margen) |
| Radicado | 23 dígitos | `CASE_NUMBER_LENGTH` · restricción de la tabla |
| Página | 10 avisos | `PAGE_SIZE` |
| Hora en la URL del PDF | `HH` en formato **12 horas** | trigger `auction_notices_before_write` · `dashboard/remates/pdfUrl.ts` |

Las fechas se muestran en `America/Bogota`. El corte usa el `now` capturado en cada consulta.

## Estados

Hay dos estados que no se mezclan:

| Estado | Dónde se ve | Cómo se calcula |
|---|---|---|
| Agendado / Realizado | Solo sitio público | No se guarda: Realizado desde 60 min después de `scheduled_at` |
| Publicado / Oculto | Solo dashboard (`PublicationBadge`) | Columna `is_published` |

Pestañas (las dos usan el mismo corte de 60 min):

- Público: **Próximos** (del más cercano al más lejano) y **Pasados** (del más reciente).
- Dashboard: **Próximos**, **Pasados** y **Todos**, con filtro de publicación.

## URL del PDF

```
https://publicacionesprocesales.ramajudicial.gov.co/documents/<group_id>/<folder_id>/<radicado>-<AAAAMMDD><HH>-J0<juzgado>ECC.pdf
```

- `group_id` / `folder_id`: la fila de `pdf_folders` vigente en el **`created_at`** del aviso (fecha de
  publicación), no en la fecha del remate. Al cambiar de carpeta se agrega una fila nueva; las viejas no
  se editan. Solo se borra una carpeta con `valid_from` futura.
- Se regenera si cambia el radicado, el juzgado o la fecha (con la carpeta del `created_at` original).
  Si no, se respeta una URL corregida a mano.
- Sin carpeta vigente, el aviso no se guarda (`no_pdf_folder`).
- "Descargar PDF" usa `?download=true` (el atributo `download` no sirve: el PDF es de otro origen).

## Reglas

- Radicado + fecha y hora únicos. Un radicado puede tener varios avisos en fechas distintas.
- Se permiten fechas pasadas (para cargar avisos antiguos).
- `created_at` no cambia nunca; `updated_at`, `created_by` y `updated_by` los pone la base.
- Trigger `auction_notices_authorize` (solo con usuario; corre antes que el de la URL):
  - cambiar datos (radicado, juzgado, fecha, URL) exige `remates.editar`;
  - cambiar `is_published` exige `remates.publicar`;
  - un aviso creado sin `remates.publicar` queda oculto aunque se envíe publicado.
- Eliminar es definitivo.

## Permisos (por juzgado, salvo carpetas)

Asignación vigente (Roles, 2026-10-15; la migración daba crear/editar/publicar/eliminar a juzgado):

| Permiso | Permite | Roles |
|---|---|---|
| `remates.ver` | Ver la sección y los avisos ocultos | juzgado, oficina, director_oficina |
| `remates.crear` | Crear | solo superadmin |
| `remates.editar` | Cambiar datos y corregir la URL | solo superadmin |
| `remates.publicar` | Publicar u ocultar | solo superadmin |
| `remates.eliminar` | Eliminar | solo superadmin |
| `remates.carpetas` | Ver y agregar carpetas (configuración común) | solo superadmin |

Rol juzgado: solo su juzgado, que queda fijo en filtros y formulario.

## Relación con Audiencias

- Al crear un aviso **futuro**, con `audiencias.crear` en ese juzgado, se ofrece "Crear también la
  audiencia de remate"; se guarda con `create_auction_notice_with_hearing()` (una transacción). Se
  desactiva, con el motivo, si la fecha y hora rompen las reglas de audiencias.
- Cambiar radicado, juzgado o fecha mueve la audiencia vinculada si sigue Programada. Si la audiencia
  no se puede mover, el aviso no se guarda (el formulario lo advierte antes).
- Eliminar el aviso elimina su audiencia si es eliminable; si no, queda "Aviso de remate eliminado".
- Detalle completo en [audiencias.md](audiencias.md).

## Archivos y migraciones

- Público: `src/pages/Remates.tsx`, `src/components/remates/` (`useRematesFilters`,
  `useAuctionNotices`, `RemateDetailModal`). Tabla compartida con el dashboard: `tableStyles.ts` y
  `NoticeCells.tsx`.
- Dashboard: `src/dashboard/remates/` (`AdminRematesTable`, `NoticeFormModal`, `pdfUrl.ts`,
  `FoldersPage`).
- Migraciones: `20261002120000_create_auction_notices`, `20261005180000_auction_notices_admin`,
  `20261009120000_hearings_auction_notices`.

## Preguntas frecuentes (desarrollo)

- **"Ver aviso" da 404.** El juzgado no ha subido el PDF al portal, el nombre del archivo no coincide
  (revisar la hora en formato 12 h) o la carpeta vigente no es la correcta. Se corrige la URL a mano o
  se agrega la carpeta.
- **Un aviso creado no aparece en el público.** Está oculto: quien lo creó no tiene `remates.publicar`.
- **Sigue en Próximos después de su hora.** Normal durante los 60 minutos siguientes.

## Historial

[plan-remates](../plan-remates.md) · [plan-remates-dashboard](../plan-remates-dashboard.md) ·
[plan-remates-ilustracion](../plan-remates-ilustracion.md) · [plan-audiencias](../plan-audiencias.md)
(integración, fase 3)
