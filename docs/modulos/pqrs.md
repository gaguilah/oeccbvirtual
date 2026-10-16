# PQRS

Documento vivo: describe cómo funciona **hoy** la sección. Si un cambio modifica una regla, este archivo
se actualiza en el mismo commit. La historia de cada decisión está en los planes enlazados al final.

## Qué es

Peticiones, quejas, reclamos, sugerencias y felicitaciones de los ciudadanos a la oficina. Llegan por el
formulario público, se guardan con un radicado propio y se responden por correo desde el dashboard. Son
de la oficina, no de un juzgado.

| Dónde | Ruta | Quién |
|---|---|---|
| Sitio público | `/pqrs` | Cualquiera |
| Dashboard | `/dashboard/pqrs` y `/dashboard/pqrs/:id` | `pqrs.ver` |

## Valores clave

| Valor | Cifra | Dónde vive (cambiar juntos) |
|---|---|---|
| Plazo de respuesta | 15 días hábiles desde el día siguiente a la radicación | `pqrs_due_date()` (SQL, `20261007150000`) · `RESPONSE_BUSINESS_DAYS` en `dashboard/pqrs/deadline.ts` (solo texto) |
| "Por vencer" | 3 días hábiles o menos | `deadline.ts` |
| Mensaje del ciudadano | Máximo 2.000 caracteres | `SUMMARY_MAX_CHARS` en `components/pqrs/data.ts` · `submit-request` |
| Respuesta | Máximo 5.000 caracteres | `RESPONSE_MAX` en `respond-request` |
| Motivo de cierre | 5 a 500 caracteres | `set_request_status()` |
| Radicado | `PQRS-<año>-<6 dígitos>`, contador por año | `request_counters` |

Días hábiles: lunes a viernes sin los días de `non_business_days` (Días no hábiles). El plazo lo calcula
**solo la base** (`due_date`, `business_days_left`); el navegador solo decide cómo mostrarlo.

## Formulario público (3 pasos)

1. Tipo: Petición, Queja, Reclamo, Sugerencia o Felicitación.
2. Nombre y correo.
3. Mensaje, aceptación de términos (obligatoria) y Turnstile.

- Edge Function `submit-request` (sin JWT): valida, verifica Turnstile, rechaza sin términos, guarda en
  `customer_requests` con `terms_accepted_at` y la service role. El navegador nunca escribe la tabla.
- El ciudadano ve su radicado al terminar (`RequestSent`).
- Correos: acuse al ciudadano (sin reply-to; el pie pide no responder y enlaza a `/contacto`) y aviso al
  buzón de la oficina si el secreto `PQRS_OFFICE_NOTICE` es `on` (activo desde 2026-10-12).
- Términos: `pqrs/terms.ts` y `docs/terminos-tratamiento-datos.md` se cambian juntos.

## Estados

| Estado | Cómo se llega | Siguiente |
|---|---|---|
| Recibida | Al llegar | En trámite, Respondida, Cerrada |
| En trámite | `set_request_status` (`pqrs.gestionar`) | Respondida, Cerrada |
| Respondida | `respond-request` (`pqrs.responder`) | **Ninguno**: nunca cambia |
| Cerrada | `set_request_status`, con motivo | Reabrir → En trámite |

- Pendientes = Recibida + En trámite. Solo las pendientes tienen plazo y pueden quedar vencidas.
- Reabrir no reinicia el plazo: se cuenta siempre desde la radicación.
- La respuesta se envía **una sola vez** y no se edita. Si el correo falla, queda guardada y se ofrece
  "Reenviar respuesta" (acción `resend`).

## Permisos (sin juzgado)

Asignación vigente (Roles, 2026-10-15; la migración daba `pqrs.gestionar` también a oficina):

| Permiso | Permite | Roles |
|---|---|---|
| `pqrs.ver` | Lista, detalle e historial de correos | oficina, director_oficina |
| `pqrs.gestionar` | En trámite, cerrar, reabrir | director_oficina |
| `pqrs.responder` | Responder y reenviar | director_oficina |

El rol juzgado no ve PQRS. Superadmin tiene todo.

## Dashboard

- Pestañas: Pendientes (por defecto, de la más antigua), Respondidas, Cerradas, Todas. Filtro por tipo y
  búsqueda por radicado, nombre o correo.
- Detalle: solicitud, respuesta con vista previa del correo y confirmación, historial de correos
  (`request_emails`), auditoría (`request_audit`).
- Inicio: pendientes y vencidas (`pqrs_summary()`).

## Archivos y migraciones

- Público: `src/pages/Pqrs.tsx`, `src/components/pqrs/` (`PqrsForm`, `schema.ts`, `api.ts`,
  `TermsField`, `TermsModal`).
- Dashboard: `src/dashboard/pqrs/` (`deadline.ts`, `StatusDialog`, `RequestDetailPage`).
- Funciones: `supabase/functions/submit-request` (sin JWT), `respond-request` (**con** JWT),
  `_shared/email.ts` (`sendAndLog`, nunca lanza error; todo queda en `email_log`),
  `_shared/emails/pqrs.ts`. Datos de la oficina repetidos en `_shared/office.ts` y `src/lib/contact.ts`.
- Migraciones: `20261001120000_create_customer_requests`, `20261001130000_customer_requests_type_check`,
  `20261007120000_pqrs_request_number_email_log`, `20261007130000_pqrs_terms_accepted`,
  `20261007140000_pqrs_admin`, `20261007150000_non_business_days`.

## Preguntas frecuentes (desarrollo)

- **El plazo no coincide con lo esperado.** Revisar que los festivos del año estén cargados en Días no
  hábiles: el plazo depende de esa tabla.
- **El ciudadano dice que no le llegó la respuesta.** Revisar el historial de correos (`email_log`) y
  usar "Reenviar respuesta".
- **No llega el aviso a la oficina.** Revisar el secreto `PQRS_OFFICE_NOTICE` y `email_log`.

## Historial

[plan-correos-resend](../plan-correos-resend.md) · [plan-pqrs-dashboard](../plan-pqrs-dashboard.md) ·
[plan-dias-no-habiles](../plan-dias-no-habiles.md) · [plan-pqrs-ilustracion](../plan-pqrs-ilustracion.md)
