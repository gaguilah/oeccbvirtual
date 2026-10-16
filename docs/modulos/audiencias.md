# Audiencias

Documento vivo: describe cómo funciona **hoy** la sección. Si un cambio modifica una regla, este archivo
se actualiza en el mismo commit. La historia de cada decisión está en los planes enlazados al final.

## Qué es

Registro de las audiencias y diligencias de los Juzgados 1 y 2. Se programan en el dashboard, se
cierran como Realizada o Cancelada, se publican en `/audiencias` y se comunican por correo.

| Dónde | Ruta | Quién |
|---|---|---|
| Sitio público | `/audiencias` | Cualquiera, solo lectura |
| Dashboard | `/dashboard/audiencias` | `audiencias.ver` en el juzgado |
| Tipos de audiencia | `/dashboard/audiencias/tipos` | `audiencias.tipos` (solo superadmin) |

## Valores clave

| Valor | Cifra | Dónde vive (cambiar juntos) |
|---|---|---|
| Horario para programar | 7:00 a. m. a 5:00 p. m., saltos de 15 min | `hearing_schedule_error` (SQL) · `FIRST_HOUR` / `LAST_HOUR` en `dashboard/audiencias/data.ts` · `scheduleProblem` en `schedule.ts` |
| Duración supuesta | 60 min (solo calendario y cruce de horario) | `HEARING_MINUTES` en `data.ts` |
| Marcar Realizada desde | 60 min después de la hora | `hearings_rules` · `CLOSE_AFTER_MINUTES` en `data.ts` |
| Marcar Cancelada desde | La hora programada | `hearings_rules` · `canCancelNow` |
| Pasa a Anteriores (público) | Cerrada, o 60 min después de la hora | `list_public_hearings` (`20261014150000`) · `REALIZADO_DESPUES_DE_MIN` en `components/remates/constants.ts` |
| Pasa a Por cerrar (dashboard) | En cuanto llega la hora, si sigue Programada | `dashboard/audiencias/api.ts` (pestañas) |
| Ventana pública | Desde 3 meses atrás + todas las futuras | `list_public_hearings` |
| Recordatorio | ≈ 15 min antes (ventana de 10 a 20 min, revisión cada 5 min) | `hearings-mailer` |
| Tope de recordatorios | 90 correos enviados en el día | `DAILY_REMINDER_LIMIT` en `hearings-mailer` |
| Listado semanal | Primer día hábil de la semana, 7:30 a. m. | pg_cron `audiencias-semanal` (12:30 UTC) |

Todas las horas se calculan en `America/Bogota` y con el reloj del servidor, no el del navegador.

## Estados

| Estado | Cómo se llega | Qué se puede hacer después |
|---|---|---|
| Programada (1) | Al crear | Editar todo, cerrar, eliminar (con condiciones) |
| Realizada (2) | Desde 1 h después de la hora, con enlace de grabación obligatorio | Solo corregir la grabación; descargar el formato; marcar cargado al expediente |
| Cancelada (3) | Desde la hora programada; observaciones opcionales | Nada (cerrada) |

### Pestañas: dashboard y sitio público usan cortes distintos a propósito

| Momento (audiencia a las 10:00, sin cerrar) | Dashboard | Sitio público |
|---|---|---|
| 9:59 | Próximas | Próximas · Programada |
| 10:00 – 10:59 | **Por cerrar** | **Próximas** · Programada |
| 11:00 en adelante | Por cerrar | Anteriores · **Por confirmar** |
| Cerrada (a cualquier hora) | Cerradas | Anteriores · Realizada / Cancelada |

El dashboard avisa al juzgado en cuanto llega la hora. El público mantiene la audiencia en Próximas
durante la hora en que se realiza. "Conectarse" sigue visible en el público mientras esté Programada,
aunque ya diga "Por confirmar".

## Reglas (trigger `hearings_rules`; solo con usuario, no en SQL Editor)

- **Crear:** nace Programada; fecha y hora futuras; lunes a viernes; día hábil (`is_business_day`, tabla
  `non_business_days`); 7:00–17:00 en 00/15/30/45; tipo activo.
- **Editar:** todo mientras esté Programada; si cambia la fecha se revalidan las reglas de crear y se
  reinicia `reminder_sent_at`.
- **Cerrada:** solo se cambia `recording_url` de una Realizada (no se puede vaciar).
- **Eliminar:** futura, Programada, sin enlace de conexión y sin grabación. Si no, se cancela.
- **Cruce de horario:** no es regla de la base; el formulario avisa (sin bloquear) si el juzgado tiene
  otra audiencia en la misma hora.
- **Radicado + hora** únicos.
- **Tipo con enlace obligatorio y sin enlace:** se puede guardar, pero no se comunica por correo; el
  dashboard muestra "Sin enlace de conexión: no se comunicará".

`dashboard/audiencias/data.ts` (`canRealizeNow`, `canCancelNow`, `deleteBlocker`) y `schedule.ts`
(`scheduleProblem`) repiten estas reglas solo para la interfaz: cambiar junto con el SQL.

## Permisos (por juzgado: `has_permission('audiencias.x', court_id)`)

Asignación vigente (Roles, 2026-10-15; la migración daba crear/editar/eliminar también a juzgado y
oficina):

| Permiso | Permite | Roles |
|---|---|---|
| `audiencias.ver` | Ver la sección, descargar el formato y recibir correos | juzgado, oficina, director_oficina |
| `audiencias.crear` | Crear (y "Crear también la audiencia" desde un aviso) | director_oficina |
| `audiencias.editar` | Editar, cerrar, corregir grabación, marcar expediente | director_oficina |
| `audiencias.eliminar` | Eliminar | director_oficina |
| `audiencias.tipos` | Tipos de audiencia | solo superadmin |

Rol juzgado: solo su juzgado (`profiles.court`). Oficina y director: los dos.

## Correos (`supabase/functions/hearings-mailer`, `--no-verify-jwt`, cabecera `x-cron-secret`)

| Correo | Cuándo | Qué incluye |
|---|---|---|
| Listado semanal | Primer día hábil de la semana, 7:30 a. m., una vez (`hearing_weekly_sends`) | Programadas de lunes a viernes de esa semana, agrupadas por día |
| Aviso de cambio | Solo si el listado de la semana ya salió y la audiencia es de esa semana | `nueva`, `cambio` (fecha, hora, tipo, radicado, juzgado o enlace) o `retirada` (eliminada o movida a otra semana). Cerrarla no genera aviso |
| Recordatorio | ≈ 15 min antes, una vez (`reminder_sent_at`, se reinicia al reprogramar) | Solo esa audiencia |

- Solo se comunican las Programadas cuyo tipo no exige enlace o que ya lo tienen. Agregar el enlace a
  una audiencia de la semana en curso genera el aviso `nueva`.
- Destinatarios: `hearing_recipients(court)` = usuarios activos con `audiencias.ver` en el juzgado
  (superadmin incluido) + buzón del juzgado (`execution_courts.email`).
- pg_cron: `audiencias-semanal` (días de semana 12:30 UTC) y `audiencias-tick` (cada 5 min, 11–22 UTC
  = 6 a. m.–5 p. m. Colombia). URL y secreto en Vault.
- Plantillas: `_shared/emails/hearings.ts` (`COURT_NAMES` repite `src/lib/courts.ts`).
- Desde el 2026-10-12 van a los destinatarios reales (sin `HEARINGS_EMAIL_TEST_TO`).

## Formato de referencia cruzada y expediente

- Solo Realizadas. PDF CENDOJ (Oficio) generado en el navegador al descargar, nunca guardado
  (`dashboard/audiencias/formato/`; `render.ts` solo por `import()`).
- "Elaborado por", "Cargo" y "Fecha de elaboración" = quien registró o corrigió por última vez la
  grabación (`recording_set_by_name`, `recording_set_by_position`, `recording_set_at`, trigger
  `hearings_recording_author`). Por eso el perfil exige cargo.
- **Cargado al expediente:** `filed_at` (null = pendiente). Lo escribe el navegador con
  `audiencias.editar`; el trigger `hearings_filed_rules` pone hora y usuario. Corregir la grabación lo
  devuelve a Pendiente. No cuenta como modificación (no toca `updated_at` ni genera correos).

## Relación con Avisos de Remate

- Al crear un aviso futuro se ofrece "Crear también la audiencia de remate" (con `audiencias.crear` en
  ese juzgado); se guardan juntos con `create_auction_notice_with_hearing()`. Si ya existe una
  audiencia con el mismo radicado y hora, se vincula en lugar de duplicarla.
- Cambiar radicado, juzgado o fecha del aviso mueve la audiencia vinculada si sigue Programada; si la
  nueva fecha rompe las reglas de audiencias, el aviso no se guarda.
- Eliminar el aviso elimina la audiencia si es eliminable; si no, queda con "Aviso de remate
  eliminado".

## Archivos y migraciones

- Público: `src/pages/Audiencias.tsx`, `src/components/audiencias/`.
- Dashboard: `src/dashboard/audiencias/`.
- Migraciones: `20261008150000_hearings`, `20261008170000_public_hearings`,
  `20261009120000_hearings_auction_notices`, `20261009150000_hearings_emails`,
  `20261013120000_hearing_format`, `20261014120000_hearings_filed`,
  `20261014150000_public_hearings_cutoff`.

## Preguntas frecuentes (desarrollo)

- **Una audiencia no pasa a Anteriores en el público.** Revisar la hora del servidor: pasa a los 60 min
  de su hora o al cerrarla. Consulta directa: `rpc/list_public_hearings` con `p_period`.
- **No llegó un recordatorio.** Revisar `email_log`, `reminder_sent_at`, que el tipo tenga enlace si lo
  exige, el tope de 90 diarios y que la hora esté dentro de 11–22 UTC.
- **No llegó el aviso de un cambio.** Solo hay aviso si el listado de esa semana ya salió
  (`hearing_weekly_sends`) y la audiencia es de la semana en curso.

## Historial

[plan-audiencias](../plan-audiencias.md) ·
[plan-audiencias-formato](../plan-audiencias-formato.md) ·
[plan-audiencias-expediente](../plan-audiencias-expediente.md) ·
[plan-audiencias-publica-tiempos](../plan-audiencias-publica-tiempos.md)
