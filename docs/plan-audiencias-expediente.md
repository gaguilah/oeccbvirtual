# Plan: marcar el formato como cargado al expediente (Audiencias)

> **Histórico.** El comportamiento actual está en [modulos/audiencias.md](modulos/audiencias.md). Si este plan y el módulo no coinciden, vale el módulo.

Estado: **construido** (14 de octubre de 2026), en la rama `audiencias-formato`. Falta correr la migración `20261014120000_hearings_filed.sql` y el SQL de datos.

## Objetivo

Después de descargar el formato de referencia cruzada (docs/plan-audiencias-formato.md), el
funcionario lo carga al expediente fuera de la aplicación. Se registra que ya se cargó con un
interruptor on/off en la audiencia, y el Inicio muestra cuántas faltan.

## Decisiones

| Tema | Decisión |
|---|---|
| Qué audiencias | Solo las que están en **Realizada** (las únicas con formato). |
| Quién marca o desmarca | Quien puede editar audiencias en ese juzgado (`audiencias.editar`). Sin permiso nuevo. |
| Marcar | Interruptor en el modal de detalle, sin confirmación. |
| Desmarcar | Permitido, con confirmación (`ConfirmDialog` `tone="update"`: "¿Desmarcar como cargado al expediente?"). |
| Si se corrige la grabación | La marca vuelve sola a **Pendiente**: el formato cambió y hay que volver a cargarlo. El diálogo de corregir la grabación lo avisa. |
| Audiencias realizadas existentes | Todas, de hoy hacia atrás, quedan como **cargadas** (SQL aparte). |
| Para encontrar las pendientes | **Contador** en la tarjeta de Audiencias del Inicio. Sin filtro. |
| Correos | Ninguno. |

## Base de datos (una migración)

1. **Columnas en `hearings`**:
   - `filed_at` (timestamptz): cuándo se marcó como cargado; `null` = pendiente.
   - `filed_by` (usuario) y `filed_by_name` (copia del nombre en ese momento, como la grabación).
2. **Cómo se escribe**: el navegador actualiza solo `filed_at` (grant de esa columna; la política de
   UPDATE de `hearings` exige `audiencias.editar` en el juzgado) y el trigger `hearings_filed_rules` lo
   normaliza: la fecha la pone el servidor y `filed_by` / `filed_by_name` no se pueden escribir. (El
   plan proponía una función `set_hearing_filed`; con el grant de una columna y el trigger queda igual
   de seguro y sin una función más.)
3. **Reglas en el trigger** (las mismas para la función y para cualquier otra escritura con usuario):
   - Solo se marca una audiencia en Realizada (`hearing_filed_not_realizada`).
   - Al marcar: `filed_at = now()`, `filed_by` y `filed_by_name` del usuario. Al desmarcar: las tres en
     `null`.
   - Si cambia `recording_url`: las tres vuelven a `null` (pendiente).
   - Cambiar solo la marca no se considera un cambio de la audiencia: no toca `updated_at` /
     `updated_by` ni encola avisos por correo.
4. **Contador**: se cuenta con la misma consulta de la tarjeta de Inicio (`status_id = 2` y
   `filed_at is null`), con las políticas de lectura de siempre (cada uno ve su juzgado).

## Datos (SQL aparte, fuera del repositorio, lo corre el usuario)

Todas las audiencias en Realizada, de hoy hacia atrás, quedan cargadas: `filed_at` = fecha en que se
registró la grabación (`recording_set_at`, o la de la audiencia si no hay), `filed_by_name` =
"Giovanni Aguilar Hernández". Con los triggers apagados en esa transacción, como en el SQL del formato.

## Dashboard

1. **`Switch`** (componente nuevo en `components/ui`, reutilizable): botón con `role="switch"` y
   `aria-checked`, se usa con el teclado (Espacio / Enter), etiqueta visible, estado deshabilitado con
   motivo y estado "guardando". Colores con los tokens (`primary` encendido, `surface-container`
   apagado).
2. **Modal de detalle** (`HearingDetailModal`), solo en Realizada, fila "Expediente":
   - Quien puede editar: el interruptor "Cargado al expediente"; debajo, "Cargado el 14 oct 2026 por
     <nombre>" o "Pendiente de cargar".
   - Quien solo ve: el mismo texto, sin interruptor.
   - El cambio se guarda al instante; si falla, el interruptor vuelve a su estado y se muestra el
     error.
3. **Tabla y tarjetas** (`HearingsTable`): en las realizadas, etiqueta **En expediente** (verde) o
   **Pendiente de cargar** (ámbar) junto al estado; en las tarjetas, en la fila de etiquetas de abajo a
   la izquierda.
4. **Menú ⋮**: "Marcar cargado al expediente" / "Desmarcar cargado al expediente" (este con la
   confirmación), solo en Realizada y con `audiencias.editar`.
5. **Corregir grabación**: el diálogo avisa "El formato quedará como pendiente de cargar al
   expediente" cuando la audiencia ya estaba cargada.
6. **Inicio**: la tarjeta de Audiencias suma la etiqueta "N por cargar al expediente" (ámbar) cuando
   hay alguna, junto a "hoy" y "por cerrar".

## Etapas

1. Migración (columnas, función, reglas del trigger) + SQL de datos.
2. `Switch` en `components/ui`.
3. Modal, etiquetas de tabla y tarjetas, menú ⋮ y aviso al corregir la grabación.
4. Contador en el Inicio.
5. Pruebas: marcar y desmarcar (con confirmación), que solo aparezca en realizadas y con permiso, que
   corregir la grabación la deje pendiente, el contador, el interruptor con teclado y lector de
   pantalla, tabla y tarjetas (1280 / 390 px), modo oscuro. Revisión de tipos, lint y build.
6. Documentar en CLAUDE.md.

## Observación

Sin filtro, las pendientes se encuentran en la pestaña Cerradas por su etiqueta ámbar. Si con el
tiempo son muchas, se puede agregar después un filtro sin cambiar la base de datos.
