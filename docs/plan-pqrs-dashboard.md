# Plan: gestión de PQRS en el dashboard y respuesta por correo (construido el 2026-10-07)

Fase 2 de `docs/plan-correos-resend.md`. Hoy las PQRS llegan desde `/pqrs`, se guardan con su radicado y el ciudadano recibe el acuse, pero **nadie puede verlas ni responderlas desde el sitio**: solo en el panel de Supabase. Con esta sección, la oficina las lista, las responde desde `/dashboard/pqrs` y la respuesta le llega al ciudadano por correo. Rama: `pqrs-dashboard`, desde `main`.

## Punto de partida

- `customer_requests`: `request_number`, `type`, `name`, `email`, `summary`, `status` (smallint, hoy siempre 0 = recibida), `response` (vacía), `created_at`, `updated_at`, `terms_accepted_at`. RLS sin políticas: nadie la lee desde el navegador.
- Las PQRS no pertenecen a un juzgado: son de la oficina (el formulario no pregunta el juzgado).
- `email_log` registra cada correo; `_shared/email.ts` envía y registra sin bloquear.
- Convenciones del dashboard: permisos `<módulo>.<acción>` con su migración, `ActionMenu` (⋮) para las acciones de cada fila, `ConfirmDialog` para confirmar, filtros en la URL y paginación en el servidor (como Avisos de Remate).

## Permisos nuevos (módulo `pqrs`)

| Código | Nombre | Qué permite |
| --- | --- | --- |
| `pqrs.ver` | Ver PQRS | Ver la sección, la lista, el detalle y el historial de correos |
| `pqrs.gestionar` | Gestionar PQRS | Cambiar el estado (en trámite, cerrada) |
| `pqrs.responder` | Responder PQRS | Escribir y enviar la respuesta al ciudadano (y reenviarla) |

Sin alcance por juzgado: las PQRS son de la oficina, así que las políticas usan `has_permission('pqrs.x')` sin `court`.

**Asignación inicial (decidida el 2026-10-07):** solo el director de la oficina responde las PQRS. Como cada usuario tiene un solo rol, la migración crea un rol nuevo:

| Rol | Alcance | Permisos de PQRS | Otros permisos |
| --- | --- | --- | --- |
| `oficina` | Ambos juzgados | `pqrs.ver`, `pqrs.gestionar` | Los que ya tiene (`remates.ver`) |
| `director_oficina` ("Director de oficina", nuevo) | Ambos juzgados | `pqrs.ver`, `pqrs.gestionar`, `pqrs.responder` | Los mismos de `oficina` |
| `juzgado` | Su juzgado | Ninguno | Sin cambios |
| `superadmin` | Todos | Todos (implícito) | Todos |

El superadmin asigna el rol "Director de oficina" en Usuarios. Si cambian las personas o los permisos, se ajusta en Roles, sin programar.

## Estados

| Estado | Cuándo | Color |
| --- | --- | --- |
| **Recibida** | Al llegar desde el sitio | Azul |
| **En trámite** | Alguien la tomó y la está atendiendo | Ámbar |
| **Respondida** | Se envió la respuesta al ciudadano | Verde |
| **Cerrada** | Se cierra sin respuesta escrita (p. ej. una felicitación, un duplicado o un mensaje sin sentido), con un motivo | Gris |

`status` pasa de número a texto (`recibida`, `en_tramite`, `respondida`, `cerrada`), con una restricción que solo admite esos valores. Las PQRS actuales (todas en 0) quedan como `recibida`.

**Plazo:** cada PQRS muestra cuántos días hábiles le quedan de los 15 (lunes a viernes; los festivos de Colombia se agregarán más adelante) y se marca **vencida** si pasa el plazo sin respuesta.

## Base de datos (una migración)

- `customer_requests`: `status` a texto con la restricción; nuevas columnas `responded_at`, `responded_by`, `closed_reason`, `updated_by`.
- RLS: lectura con `pqrs.ver`. **Ninguna escritura directa desde el navegador:**
  - **Cambiar estado / cerrar:** función SQL `set_request_status(id, status, reason)` (verifica `pqrs.gestionar`, no deja volver una respondida a recibida, exige motivo al cerrar, registra quién y cuándo).
  - **Responder:** Edge Function `respond-request` (necesita la API de Resend).
- `request_emails(id)`: historial de correos de una PQRS desde `email_log` (acuse, respuesta, reenvíos), con `pqrs.ver`.
- Los 3 permisos, su asignación a `oficina` (ver y gestionar) y el rol nuevo `director_oficina` (los tres, más los permisos que hoy tiene `oficina`).

## Edge Function `respond-request` (con verificación de JWT, como `manage-users`)

Acciones:

1. **`respond`**: exige `pqrs.responder`; valida la respuesta (no vacía, máximo 5.000 caracteres); guarda `response`, `responded_at`, `responded_by` y `status = respondida`; envía el correo de respuesta y lo registra. Si el correo falla, la respuesta **queda guardada** y la función lo informa para que el dashboard ofrezca "Reenviar".
2. **`resend`**: vuelve a enviar la respuesta ya guardada (si el correo falló o el ciudadano dice que no le llegó).

Una PQRS se responde **una sola vez**: la respuesta enviada es la oficial y no se puede editar ni reemplazar (decidido el 2026-10-07). Si hace falta corregir, se hace aparte desde el buzón de la oficina.

### Correo de respuesta

- Asunto: `Respuesta a su PQRS – Radicado PQRS-2026-000123`.
- Cuerpo: saludo, radicado, tipo y fecha de la solicitud, **la respuesta de la oficina** y, debajo, su solicitud original citada.
- Mismo pie que el acuse ("Este es un mensaje automático. Por favor, no conteste…" con enlace a Contacto); sin `reply_to`.

## Dashboard (`src/dashboard/pqrs/`)

### Lista (`/dashboard/pqrs`)

```
[Pendientes] [Respondidas] [Cerradas] [Todas]     Tipo: [Todos ▾]   Buscar: [radicado, nombre o correo]
┌──────────────────┬──────────────┬───────────┬──────────────────────┬─────────────┬──────────┬───┐
│ Radicado         │ Fecha        │ Tipo      │ Ciudadano            │ Estado      │ Plazo    │   │
├──────────────────┼──────────────┼───────────┼──────────────────────┼─────────────┼──────────┼───┤
│ PQRS-2026-000012 │ 7 oct 2026   │ Petición  │ Ana Peña             │ Recibida    │ 14 días  │ ⋮ │
│                  │ 9:35 a. m.   │           │ ana@ejemplo.com      │             │          │   │
│ PQRS-2026-000008 │ 1 oct 2026   │ Queja     │ José Ruiz            │ En trámite  │ Vencida  │ ⋮ │
└──────────────────┴──────────────┴───────────┴──────────────────────┴─────────────┴──────────┴───┘
Mostrando 1–10 de 23                                                              ‹ 1 2 3 ›
```

- **Pestañas:** Pendientes (recibidas + en trámite, la vista por defecto), Respondidas, Cerradas, Todas.
- **Filtros** en la URL: tipo y búsqueda (radicado, nombre o correo). Paginación en el servidor, de 10 en 10.
- **Orden:** pendientes de la más antigua a la más nueva (las que vencen primero arriba); las demás, de la más reciente.
- **Menú ⋮** por fila: Ver, Responder (`pqrs.responder`, si no está respondida ni cerrada), Marcar en trámite / Cerrar (`pqrs.gestionar`), Reenviar respuesta (si el correo falló).
- Tabla desde `xl`, tarjetas por debajo (como Avisos de Remate).

### Detalle (`/dashboard/pqrs/:id`)

Página propia (no modal), porque ahí se escribe la respuesta:

- Encabezado: radicado, estado, tipo, fecha, plazo.
- Ciudadano: nombre y correo (con copiar).
- **Solicitud** original (texto completo).
- **Respuesta:**
  - Si no está respondida: área de texto para escribirla, con contador, **vista previa del correo** y botón "Enviar respuesta" → `ConfirmDialog` "¿Enviar la respuesta?" (tono actualizar; aclara que se enviará a `<correo>` y no se puede modificar después).
  - Si está respondida: el texto enviado, quién y cuándo.
  - Si está cerrada: el motivo.
- **Historial de correos:** acuse, respuesta y reenvíos, con estado (enviado / falló) y fecha; "Reenviar respuesta" si el último envío falló.
- Acciones de estado en el ⋮ del encabezado.

### Inicio y menú

- "PQRS" pasa a `ready: true`.
- En Inicio, la tarjeta de PQRS muestra cuántas están **pendientes** y cuántas **vencidas** (función `pqrs_summary()` con `pqrs.ver`).

## Verificación

- SQL: sin `pqrs.ver` no se lee nada; sin `pqrs.gestionar` no se cambia el estado; una respondida no vuelve a recibida; el navegador no puede escribir `response`.
- Flujo completo con un correo propio: PQRS desde el sitio → aparece como Recibida → En trámite → Responder → llega el correo → estado Respondida → historial con acuse y respuesta.
- Fallo de correo simulado: la respuesta queda guardada y aparece "Reenviar".
- Celular y escritorio, claro y oscuro.

## Resultado (2026-10-07, rama `pqrs-dashboard`)

- Migración `20261007140000_pqrs_admin.sql`: `status` a texto (`recibida`, `en_tramite`, `respondida`, `cerrada`, con restricción: respondida exige respuesta y fecha; cerrada exige motivo), columnas `responded_at`, `responded_by`, `closed_reason`, `closed_at`, `updated_by`; `pqrs_due_date()`; lectura con `pqrs.ver` y sin escritura desde el navegador; `set_request_status()`, `request_emails()`, `request_audit()`, `pqrs_summary()`; permisos `pqrs.ver|gestionar|responder`; rol `director_oficina` (los permisos de `oficina` más los tres de PQRS) y `oficina` con ver y gestionar.
- Edge Function `respond-request` (con verificación de JWT): `respond` (una sola vez: solo actualiza si sigue pendiente y sin respuesta) y `resend`. Plantilla `requestResponseEmail` en `_shared/emails/pqrs.ts`.
- Dashboard `src/dashboard/pqrs/`: lista con pestañas, tipo, búsqueda, paginación, estado y plazo (`deadline.ts`, misma regla que `pqrs_due_date`), menú ⋮; detalle `/dashboard/pqrs/:id` con la respuesta, vista previa del correo, confirmación, historial de correos y reenvío; `StatusDialog` (en trámite, cerrar con motivo, reabrir); Inicio muestra pendientes y vencidas. `Textarea` acepta `ref`.
- Probado en headless Edge con respuestas simuladas y **contra Supabase real (2026-10-07)**: migración aplicada (con el ajuste que borra restricciones viejas sobre `status` antes de convertirla a texto), `respond-request` desplegada con verificación de JWT y el flujo completo funcionando.
- Ajustes tras la revisión: un id inválido o inexistente muestra "Esta PQRS no existe" con "Volver a PQRS" (un id sin formato uuid no se consulta), y el pie de `ui/Textarea` apila ayuda y contador en celular.

## Decisiones (2026-10-07)

1. **Quién responde:** solo el director de la oficina, con el rol nuevo "Director de oficina". El rol `oficina` ve y gestiona el estado, pero no responde. `juzgado` no ve PQRS.
2. **Estados:** Recibida, En trámite, Respondida y Cerrada (con motivo).
3. **Plazo:** 15 días hábiles de lunes a viernes; festivos, más adelante.
4. **Respuesta:** una sola vez, sin edición.
5. **Inicio:** la tarjeta de PQRS muestra pendientes y vencidas.
6. **Adjuntos:** no; las PQRS son del Sistema de Gestión de Calidad y se responden con texto.

## Plan futuro: varios roles por usuario

Hoy cada usuario tiene un solo rol (`profiles.role_id`). Permitir varios implicaría una tabla `user_roles`, cambiar `has_permission()`, `get_my_access()`, `list_users()`, la sección Usuarios y la Edge Function `manage-users`, y sobre todo definir cómo se combinan los **alcances** (p. ej. alguien que sea "Juzgado 1" y "Oficina" a la vez: ¿qué juzgados ve en cada sección?). Mientras un rol propio resuelva cada caso (como "Director de oficina"), no se recomienda. Se retoma si aparece un caso que no se pueda cubrir con un rol.
