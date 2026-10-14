# Plan: Próximas / Anteriores por hora en la página pública de Audiencias

Estado: **construido** (14 de octubre de 2026), en la rama `audiencias-formato`. Falta correr la migración `20261014150000_public_hearings_cutoff.sql`.

## Problema

`/audiencias` separa Próximas y Anteriores por **día** (`list_public_hearings`, migración
`20261008170000`): todo lo de hoy sigue en "Próximas audiencias" hasta la medianoche, aunque ya se haya
realizado o cancelado, y una audiencia que el juzgado no cerró aparece al día siguiente en
"Anteriores" con la etiqueta "Programada". Avisos de Remate, en cambio, pasa un aviso a "Pasados" 60
minutos después de su hora (`REALIZADO_DESPUES_DE_MIN`).

## Decisiones

| Tema | Decisión |
|---|---|
| Cuándo pasa a Anteriores | Cuando ya está **cerrada** (Realizada o Cancelada) **o** pasaron **60 minutos** desde su hora, lo primero que ocurra. |
| Quién decide la hora | El servidor (`now()` en `list_public_hearings`), no el reloj del equipo de quien consulta. |
| Etiqueta "Por confirmar" | Programada, más de 60 minutos después de su hora y sin cerrar: "Por confirmar" (gris). En los demás casos, la etiqueta de siempre (Programada, Realizada, Cancelada). |
| "Conectarse" | Se muestra mientras la audiencia esté Programada (hasta que el juzgado la cierre), aunque ya esté en Anteriores como "Por confirmar". Igual que hoy. |
| Margen | 60 minutos, los mismos de Avisos de Remate. |

Ejemplos (audiencia a las 8:00 a. m.):

| Hora de consulta | Estado guardado | Pestaña | Etiqueta |
|---|---|---|---|
| 7:30 a. m. | Programada | Próximas | Programada |
| 8:45 a. m. | Programada | Próximas | Programada |
| 9:00 a. m. en adelante | Programada | Anteriores | Por confirmar |
| 8:30 a. m. | Cancelada | Anteriores | Cancelada |
| 9:15 a. m. | Realizada | Anteriores | Realizada |

## Base de datos (una migración)

`list_public_hearings` se reemplaza (cambia lo que devuelve, así que se borra y se vuelve a crear con
los mismos permisos: `anon` y `authenticated`):

1. **Corte**: `pasada = status_id <> 1 or scheduled_at <= now() - interval '60 minutes'`.
   - `proximas`: `not pasada`, de la más cercana a la más lejana.
   - `anteriores`: `pasada`, de la más reciente a la más antigua.
2. **Columna nueva** `pending_confirmation boolean`: `status_id = 1 and scheduled_at <= now() - 60 min`
   (la etiqueta "Por confirmar" sale de aquí, sin depender del reloj del navegador).
3. Igual que hoy: ventana de 3 meses hacia atrás (desde el día, hora de Colombia), filtros de juzgado,
   radicado y fechas, desempate por radicado, máximo 50 por página, `total_count`, nunca `notes`.

El margen de 60 minutos queda escrito en SQL; si cambia `REALIZADO_DESPUES_DE_MIN`
(`components/remates/constants.ts`), hay que cambiar los dos (se anota en ambos lugares).

## Sitio público (`components/audiencias/`)

1. `types.ts`: `PublicHearing` suma `pending_confirmation`.
2. `constants.ts`: etiqueta "Por confirmar" (variante `neutral`) y el comentario del estado actualizado.
3. Una sola función para la etiqueta pública (`publicStatus(hearing)`), usada por `AudienciasTable`
   (tabla y tarjetas) y `AudienciaDetailModal`.
4. `AudienciaDetailModal`: "Conectarse" sigue saliendo mientras esté Programada; el aviso de "sin
   enlace" no cambia.
5. Sin cambios en filtros, URL, paginación ni ilustración.

## Fuera de alcance

- Dashboard: "Por cerrar" sigue apareciendo desde la hora programada (es para el juzgado).
- Correos de audiencias.
- Avisos de Remate (su regla no cambia).

## Etapas

1. Migración con la nueva `list_public_hearings`.
2. Tipos, etiqueta y modal del sitio público.
3. Pruebas: una audiencia antes de su hora, a los 45 y a los 75 minutos sin cerrar, cancelada y
   realizada el mismo día (pestaña y etiqueta de cada una), "Conectarse" en una "Por confirmar", filtros
   y paginación en ambas pestañas, celular y escritorio. Revisión de tipos, lint y build.
4. Documentar en CLAUDE.md (sección Hearings, public).

## Orden de despliegue

La migración va antes que el código: la página actual sigue funcionando con la función nueva (solo
ignora la columna extra), pero el código nuevo necesita esa columna.
