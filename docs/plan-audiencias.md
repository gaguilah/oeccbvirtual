# Plan: Audiencias (aprobado el 2026-10-08)

Gestión de las audiencias de los Juzgados 1 y 2: se crean con los datos básicos en estado **Programada** y, después de la fecha, se cierran como **Realizada** (con el enlace de la grabación) o **Cancelada**. Se ven en el dashboard en tabla o en calendario, se publican en una página pública de solo lectura y se comunican por correo: el listado semanal, el aviso de cada cambio y un recordatorio 15 minutos antes. Al crear un aviso de remate se puede crear también su audiencia.

Rama: `audiencias`. Sección del menú ya prevista en `docs/plan-dashboard.md` (opción "Audiencias", hoy "Pronto").

## Decisiones tomadas

| Tema | Decisión |
| --- | --- |
| Estados | Programada → Realizada o Cancelada. No hay más; los dos últimos cierran el ciclo |
| Tipos de audiencia | Tabla propia; solo el superadmin los crea, edita y elimina. Cada tipo dice si requiere enlace de conexión |
| Juzgados | Los mismos Juzgado 1 y 2 del sitio. Rol juzgado: solo el suyo; oficina: los dos |
| Despachos | No se crean: los roles ya cubren el acceso por juzgado |
| Quién gestiona | Rol juzgado (su juzgado) y oficina (los dos): crear, editar, cerrar y eliminar |
| Fecha y hora al crear | Solo fechas futuras, de lunes a viernes y sin días no hábiles (se impide). Hora de 7:00 a. m. a 5:00 p. m. (la última empieza a las 5:00 p. m.), en saltos de 15 minutos |
| Cruce de horario | Si el juzgado ya tiene otra audiencia que se cruza, se avisa pero se permite |
| Duración | Fija de 1 hora (solo para el calendario y el cruce); no hay campo de duración |
| Realizada | Desde 1 hora después de la hora programada y **siempre** con enlace de grabación |
| Cancelada | Desde el día y la hora programados (significa "no se realizó"); observaciones opcionales. Antes de la fecha, si no se va a hacer, se reprograma cambiando la fecha |
| Cerrada | Ya no se edita, salvo el enlace de grabación de una Realizada |
| Eliminar | Solo para corregir un error: fecha futura, sin enlace de conexión, Programada y sin grabación. Si no, se cancela |
| Auditoría | `created_by`, `updated_by`, `created_at`, `updated_at` (sin historial de cambios) |
| Vistas | Tabla o calendario (por semana o por mes), a elección |
| Correos | Listado semanal (lunes o siguiente día hábil, 7:30 a. m.), aviso de cada cambio posterior y recordatorio 15 minutos antes, para todos los tipos (también diligencias). Destinatarios: usuarios con `audiencias.ver` del juzgado, incluido el superadmin. Una audiencia que requiere enlace y no lo tiene no se comunica hasta que se agregue. Mientras la Mesa de Servicio no responda, solo a gaguilah@gmail.com |
| Sitio público | Página `/audiencias` de solo lectura, después de "Avisos Remate" en el menú; muestra enlaces de conexión y grabación y las canceladas; oculta las observaciones; desde 3 meses atrás |
| Avisos de Remate | Casilla "Crear también la audiencia" (marcada por defecto) al crear un aviso futuro; la audiencia sigue los cambios de fecha del aviso y se borra con él si cumple las condiciones de eliminar |
| Nombres en la base | En inglés, como el resto (`hearings`, `hearing_types`, …) |

## Base de datos

### Tablas

**`execution_courts`** (fija, la carga la migración)

| Columna | Tipo | Nota |
| --- | --- | --- |
| `id` | smallint PK | 1 y 2: los mismos valores de `profiles.court` y `auction_notices.court` |
| `name` | text | "Juzgado 1 Civil del Circuito de Ejecución de Sentencias de Bucaramanga" |

**`hearing_statuses`** (fija: las reglas del ciclo dependen de ella)

| Columna | Tipo | Nota |
| --- | --- | --- |
| `id` | smallint PK | 1, 2, 3 |
| `code` | text único | `programada`, `realizada`, `cancelada` (lo usan las reglas) |
| `description` | text | "Programada", "Realizada", "Cancelada" |

**`hearing_types`** (CRUD del superadmin)

| Columna | Tipo | Nota |
| --- | --- | --- |
| `id` | smallint identity PK | |
| `description` | text único | 3 a 80 caracteres |
| `requires_link` | boolean | Requiere enlace de conexión para comunicarse |
| `is_active` | boolean | Un tipo inactivo no se ofrece al crear, pero las audiencias que lo usan lo conservan |
| `created_at` | timestamptz | |

Carga inicial:

| Tipo | Requiere enlace |
| --- | --- |
| Audiencia de Incidente | Sí |
| Audiencia de Nulidad | Sí |
| Audiencia de Oposición | Sí |
| Audiencia de Remate | Sí |
| Audiencia de Pruebas | Sí |
| Comité de Entrega | Sí |
| Diligencia de Secuestro | No (presencial) |
| Diligencia de Entrega | No (presencial) |

Un tipo con audiencias no se puede eliminar (llave foránea): se desactiva.

**`hearings`**

| Columna | Tipo | Nota |
| --- | --- | --- |
| `id` | uuid PK | |
| `scheduled_at` | timestamptz | Fecha y hora (en el formulario son dos campos: Fecha y Hora, en hora de Colombia). Una sola columna, como en Avisos de Remate, para comparar "1 hora después" y programar los recordatorios |
| `hearing_type_id` | smallint FK → `hearing_types` | |
| `case_number` | text | Radicado de 23 dígitos (misma regla que `auction_notices`) |
| `court_id` | smallint FK → `execution_courts` | |
| `connection_url` | text, opcional | `https://` |
| `recording_url` | text, opcional | `https://`; obligatoria para Realizada |
| `status_id` | smallint FK → `hearing_statuses` | Nace en Programada |
| `notes` | text, opcional | Observaciones (hasta 1000 caracteres); nunca se publican |
| `auction_notice_id` | uuid FK → `auction_notices`, opcional | Aviso de remate del que nació (ver integración) |
| `reminder_sent_at` | timestamptz | Marca del recordatorio; se vacía al reprogramar |
| `created_by`, `updated_by` | uuid | Los llena el trigger con el usuario |
| `created_at`, `updated_at` | timestamptz | |

- Único `(case_number, scheduled_at)`: un radicado no tiene dos audiencias a la misma hora.
- Índices por `scheduled_at` y `(court_id, scheduled_at)`.

### Reglas (trigger `hearings_rules`, aplican también fuera del dashboard)

| Momento | Regla |
| --- | --- |
| Crear | Estado Programada; fecha y hora futuras; lunes a viernes y día hábil (`is_business_day`); hora entre 7:00 a. m. y 5:00 p. m. (inclusive) en hora de Colombia; minutos 00, 15, 30 o 45; tipo activo |
| Editar (Programada) | Todos los datos; si cambia la fecha u hora, se vuelven a validar las reglas de crear y se vacía `reminder_sent_at` |
| Marcar Realizada | Ahora ≥ hora programada + 1 hora y `recording_url` presente |
| Marcar Cancelada | Ahora ≥ hora programada; observaciones opcionales |
| Cerrada | Solo se puede cambiar `recording_url` de una Realizada (sin dejarla vacía); nada más |
| Eliminar | Fecha futura, Programada, sin `connection_url` y sin `recording_url` |
| Juzgado | Un usuario de juzgado solo crea, ve y edita audiencias de su juzgado (RLS con `has_permission(..., court_id)`) |

El cruce de horario (otra audiencia del mismo juzgado en la misma hora) no es una regla de la base: el formulario lo consulta y muestra un aviso.

### Permisos (por juzgado, `has_permission('audiencias.x', court_id)`)

| Permiso | Qué permite | Inicialmente |
| --- | --- | --- |
| `audiencias.ver` | Ver la sección (y recibir los correos) | juzgado, oficina, director_oficina |
| `audiencias.crear` | Crear audiencias | juzgado, oficina, director_oficina |
| `audiencias.editar` | Editar, cerrar (Realizada / Cancelada) y corregir la grabación | juzgado, oficina, director_oficina |
| `audiencias.eliminar` | Eliminar (con las condiciones de arriba) | juzgado, oficina, director_oficina |
| `audiencias.tipos` | Gestionar los tipos de audiencia | solo superadmin |

## Dashboard (`src/dashboard/audiencias/`)

### Lista (`/dashboard/audiencias`)

```
Audiencias                                      [Tabla | Calendario]   [+ Crear audiencia]

[Próximas] [Por cerrar (3)] [Cerradas] [Todas]
Juzgado [Todos ▾]  Tipo [Todos ▾]  Desde [  ]  Hasta [  ]  Radicado [ Buscar… ]

Fecha y hora        Tipo                    Radicado            Juzgado    Estado        ⋮
lun 13 oct 9:00     Audiencia de Remate     6800131030…0012300  Juzgado 1  Programada    ⋮
                    ⚠ Sin enlace de conexión
lun 13 oct 10:30    Diligencia de Secuestro 6800131030…0045600  Juzgado 2  Programada    ⋮
```

- **Pestañas:**
  - Próximas: Programadas con fecha futura.
  - Por cerrar: Programadas cuya hora ya pasó; el número se muestra en la pestaña.
  - Cerradas: Realizadas y Canceladas.
  - Todas.
- **Filtros en la URL**, como en las demás secciones: juzgado (fijo para usuarios de juzgado), tipo, rango de fechas, radicado, pestaña, vista y página. Paginación en el servidor.
- **Avisos en la fila:**
  - "Sin enlace de conexión" si el tipo lo requiere y no lo tiene.
  - "Aviso de remate eliminado" si su aviso se borró y la audiencia no se pudo borrar.
- **Acciones (menú ⋮):**

| Acción | Cuándo no se puede (`disabledReason`) |
| --- | --- |
| Ver detalle | — |
| Editar | Cerrada: "La audiencia ya está cerrada" |
| Marcar realizada | Antes de 1 hora después: "Disponible desde las 10:00 a. m. del 13 oct." |
| Marcar cancelada | Antes de la hora programada: "Disponible desde las 9:00 a. m. del 13 oct. Para cambiar la fecha, edítela" |
| Corregir grabación | Solo aparece en las Realizadas |
| Eliminar | Explica cuál condición falta (fecha pasada, tiene enlace, cerrada o con grabación) |

- **Confirmaciones:** con `ConfirmDialog`.
  - Marcar realizada pide el enlace de grabación.
  - Marcar cancelada ofrece observaciones opcionales.
  - Eliminar usa `tone="danger"`.

### Calendario (Semana | Mes)

```
◀  Semana del 13 al 17 de octubre de 2026  ▶   [Hoy]
        lun 13      mar 14      mié 15      jue 16      vie 17
 7:00
 8:00
 9:00   ▇ Remate J1             ▇ Pruebas J2
10:00   ▇ Secuestro J2
...
17:00
```

- **Semana:** de lunes a viernes, de 7:00 a. m. a 5:00 p. m. Cada audiencia es un bloque de 1 hora con tipo, juzgado y radicado; el color depende del estado. Al hacer clic se abre el detalle.
- **Mes:** cuadrícula de lunes a viernes del mes. Cada día muestra hasta 3 audiencias (hora y tipo) y "+N más", que abre la lista de ese día. Se pasa de un mes a otro con ◀ ▶ y el botón "Hoy".
- **Días no hábiles:** aparecen sombreados con su motivo, en las dos vistas.
- **Celular:** las dos vistas pasan a lista por día.
- **En la URL:** se guardan la vista (`vista=tabla|semana|mes`) y la semana o el mes que se está viendo.
- **Filtros:** usa los mismos de la tabla (juzgado, tipo, radicado).

### Formulario (modal, crear y editar)

- **Campos:** Juzgado, Tipo, Radicado (23 dígitos; acepta pegarlo con puntos o guiones), Fecha, Hora (saltos de 15 minutos), Enlace de conexión, Observaciones.
- **Fecha:** solo días futuros y hábiles. Si se elige un día no hábil, el mensaje dice el motivo, por ejemplo "Festivo: Día de la Raza".
- **Cruce de horario:** se avisa con "El Juzgado 1 ya tiene una audiencia a las 9:00 a. m. (radicado …)", sin bloquear.
- **Enlace pendiente:** si el tipo requiere enlace y está vacío, se muestra "Puede guardarla sin enlace, pero debe agregarlo antes de comunicarla".

### Tipos de audiencia (`/dashboard/audiencias/tipos`, `audiencias.tipos`)

- Lista con la descripción, "Requiere enlace" y Activo / Inactivo.
- Crear, editar, activar / desactivar y eliminar (solo sin audiencias) desde el menú ⋮.

### Inicio

La tarjeta de Audiencias muestra "3 hoy · 2 por cerrar", según el alcance del usuario.

## Sitio público (`/audiencias`)

- **Dónde va:** en el menú, después de "Avisos Remate". También aparece en la sección de servicios de Inicio y en el pie de página.
- **Cabecera:** como las demás páginas: título, texto de apoyo y una ilustración del mismo estilo (se diseña en la fase 2).
- **Tabla:** Fecha y hora, Tipo, Radicado, Juzgado, Estado (Programada, Realizada o Cancelada), Enlace de conexión ("Conectarse ↗", o "Presencial" en las diligencias) y Grabación ("Ver grabación ↗" en las realizadas). En celular se ve como tarjetas.
- **Filtros (en la URL):** juzgado, tipo, rango de fechas y radicado. No hay filtro por estado.
- **Periodo:** desde 3 meses atrás hasta todas las futuras.
- **Lectura segura:** la página lee de una vista `public_hearings`, que expone solo esas columnas y ese periodo y **nunca las observaciones**. El sitio no lee la tabla directamente.

## Integración con Avisos de Remate

- **Al crear un aviso de remate** con fecha futura, el formulario muestra la casilla **"Crear también la audiencia de remate"**, marcada por defecto.
  - Aparece solo si el usuario tiene `audiencias.crear` en ese juzgado.
  - Crea la audiencia "Audiencia de Remate" con el mismo juzgado, radicado, fecha y hora, en estado Programada y sin enlace. El juzgado agrega el enlace después.
  - Si la fecha u hora no cumple las reglas de audiencias (día no hábil, fuera de 7:00 a. m. a 5:00 p. m. o minutos que no son 00/15/30/45), la casilla se desactiva y el formulario explica por qué. El aviso se guarda igual.
  - El aviso y su audiencia se guardan en una sola operación (función SQL): o se guardan los dos o ninguno.
- **Si cambia la fecha, la hora, el juzgado o el radicado del aviso**, la audiencia vinculada se actualiza igual mientras siga Programada. Si los nuevos datos no cumplen las reglas de audiencias, el formulario del aviso lo explica y no guarda el cambio.
- **Si se elimina el aviso**, su audiencia se elimina también, solo si cumple las condiciones de eliminar. Si no las cumple, se conserva y muestra "Aviso de remate eliminado".
- **En el dashboard**, cada audiencia vinculada enlaza a su aviso y cada aviso enlaza a su audiencia.

## Correos

Con las funciones de correo que ya existen (`_shared/email.ts`: `sendAndLog`, registro en `email_log`) y una Edge Function nueva, `hearings-mailer`.

| Correo | Cuándo | Contenido |
| --- | --- | --- |
| Listado semanal | Lunes, o el siguiente día hábil, a las 7:30 a. m. | Todas las audiencias Programadas de esa semana (lunes a viernes) del alcance de cada usuario, de todos los tipos (también diligencias y comités), agrupadas por día: hora, tipo, radicado, juzgado y enlace (o "Presencial"). Si no hay, no se envía nada |
| Aviso de cambio | Cuando, **después** del listado de la semana, se crea, edita, cancela o elimina una audiencia de esa misma semana | Solo esa audiencia: qué cambió (antes → ahora) |
| Recordatorio | 15 minutos antes de cada audiencia Programada (también diligencias) | Solo esa audiencia, con su enlace (o "Presencial") |

**Enlace pendiente:** una audiencia cuyo tipo requiere enlace y aún no lo tiene **no se comunica**: no va en el listado semanal, no genera aviso de cambio ni recordatorio. Cuando se le agrega el enlace:
- si el listado de su semana ya salió, se envía en ese momento el aviso de esa audiencia;
- si todavía no ha salido, va en el listado normal.

En el dashboard, la fila muestra "Sin enlace de conexión: no se comunicará".

- **Destinatarios:** cada usuario activo con `audiencias.ver` en el juzgado de la audiencia, incluido el superadmin. Un usuario de juzgado recibe solo lo de su juzgado; Oficina y el superadmin reciben los dos.
- **Modo de prueba:** con el secreto `HEARINGS_EMAIL_TEST_TO=gaguilah@gmail.com`, todos los correos van solo a ese correo, con "[Prueba]" en el asunto. Cuando la Mesa de Servicio confirme, se quita el secreto.
- **Programación:**
  - Tareas de Supabase (`pg_cron` + `pg_net`) llaman a `hearings-mailer` con una clave secreta (`CRON_SECRET`). Así no dependen de que alguien tenga el sitio abierto.
  - Cada 5 minutos: recordatorios pendientes (audiencias entre 10 y 20 minutos después, sin `reminder_sent_at`) y avisos de cambio en cola.
  - Cada día hábil a las 7:30 a. m.: si es el primer día hábil de la semana y el listado de esa semana no se ha enviado, se envía.
- **Cola de cambios:** un trigger guarda cada cambio en `hearing_notifications`, solo si la audiencia es de la semana en curso y el listado ya salió. La función los envía y los marca como enviados. Así un correo nunca sale dos veces.
- **Cupo:** el plan gratuito de Resend permite 100 correos al día. La función cuenta los enviados del día en `email_log`; al llegar a 90 deja de enviar recordatorios y lo registra. El dashboard muestra un aviso al superadmin.

## Fases

Se ejecutan una a una: cada fase en su propia rama, con su prueba y su commit antes de pasar a la siguiente. Fase 1 construida en la rama `audiencias` (migración `20261008150000_hearings.sql`); fase 2 en `audiencias-publica` (migración `20261008170000_public_hearings.sql`: función `list_public_hearings`, pestañas Próximas / Anteriores y una sola columna "Enlaces"); fase 3 en `audiencias-remates` (migración `20261009120000_hearings_auction_notices.sql`); fase 4 en la misma rama (migración `20261009150000_hearings_emails.sql`, función `hearings-mailer` y dos tareas de pg_cron que se programan con un SQL aparte que lleva la clave y no va al repositorio).

1. **Base y dashboard:** tablas, reglas, permisos, tipos para el superadmin, lista en tabla y calendario (semana y mes), formulario, cierre, eliminación y tarjeta de Inicio.
2. **Página pública** `/audiencias` con su vista segura e ilustración.
3. **Integración con Avisos de Remate:** casilla, sincronización de fecha y borrado.
4. **Correos:** listado semanal, avisos de cambio y recordatorios, en modo de prueba.

## Verificación

- **Reglas:**
  - No se puede crear en el pasado, en un día no hábil, en fin de semana, fuera de 7:00 a. m. a 5:00 p. m. ni con minutos que no sean 00/15/30/45.
  - Realizada solo desde 1 hora después de la hora programada y con grabación.
  - Cancelada solo desde la hora programada.
  - Cerrada: solo se cambia la grabación.
  - Eliminar respeta las cuatro condiciones.
- **Acceso:**
  - El usuario del Juzgado 1 no ve ni edita audiencias del Juzgado 2.
  - Oficina ve los dos juzgados.
  - Solo el superadmin ve "Tipos de audiencia".
- **Sitio público:** las observaciones no aparecen en ninguna respuesta de la vista.
- **Avisos de Remate:**
  - El aviso crea su audiencia.
  - Si cambia la fecha del aviso, se mueve la audiencia.
  - Al borrar el aviso se borra la audiencia, o se conserva con el aviso "Aviso de remate eliminado" si no cumple las condiciones.
- **Correos (en modo de prueba):**
  - El lunes festivo, el listado sale el martes.
  - El cambio de una audiencia de la semana después del listado genera un solo aviso.
  - El recordatorio sale una vez.
  - Una audiencia con enlace pendiente no se comunica, y se comunica al agregarle el enlace.
  - Reprogramar permite un recordatorio nuevo.

## Preguntas abiertas

Ninguna: todas resueltas el 2026-10-08.
